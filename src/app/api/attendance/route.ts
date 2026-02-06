import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Attendance from "@/lib/models/Attendance";
import Student from "@/lib/models/Student";
import Notification from "@/lib/models/Notification";
import { requireAuth } from "@/lib/permissions";
import { markAttendanceSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("attendance:read");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const class_name = searchParams.get("class_name");
    const school_id = session!.user.school_id;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    await connectDB();

    const query: Record<string, unknown> = { date, school: school_id };
    if (class_name) query.class_name = class_name;

    const attendance = await Attendance.find(query).lean();

    const studentQuery: Record<string, unknown> = {
      school: school_id,
      status: "active",
    };
    if (class_name) studentQuery.class_name = class_name;
    const students = await Student.find(studentQuery).lean();
    const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

    const enrichedAttendance = attendance.map((a) => {
      const student = studentMap.get(a.student.toString());
      return {
        attendance_id: a._id.toString(),
        date: a.date,
        school_id: a.school.toString(),
        class_name: a.class_name,
        student_id: a.student.toString(),
        status: a.status,
        marked_by: a.marked_by || "",
        marked_at: a.marked_at || "",
        notes: a.notes || "",
        student_name: student?.name || "Unknown",
        roll_number: student?.roll_number || "",
      };
    });

    const stats = {
      total: attendance.length,
      present: attendance.filter((a) => a.status === "present").length,
      absent: attendance.filter((a) => a.status === "absent").length,
      late: attendance.filter((a) => a.status === "late").length,
      leave: attendance.filter((a) => a.status === "leave").length,
    };

    return NextResponse.json({
      success: true,
      data: enrichedAttendance,
      stats,
    });
  } catch (error) {
    logError("GET", "/api/attendance", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("attendance:write");
    if (error) return error;

    const body = await request.json();
    const parsed = markAttendanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { date, class_name, records } = parsed.data;
    const school_id = session!.user.school_id;

    await connectDB();

    const bulkOps = records.map((record) => ({
      updateOne: {
        filter: {
          date,
          student: new mongoose.Types.ObjectId(record.student_id),
          school: new mongoose.Types.ObjectId(school_id),
        },
        update: {
          $set: {
            date,
            school: new mongoose.Types.ObjectId(school_id),
            class_name,
            student: new mongoose.Types.ObjectId(record.student_id),
            status: record.status as "present" | "absent" | "late" | "leave",
            marked_by: session!.user.teacher_id,
            marked_at: new Date().toISOString(),
            notes: record.notes || "",
          },
        },
        upsert: true,
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Attendance.bulkWrite(bulkOps as any);

    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === "present").length,
      absent: records.filter((r) => r.status === "absent").length,
      late: records.filter((r) => r.status === "late").length,
      leave: records.filter((r) => r.status === "leave").length,
    };

    await audit({
      action: "create",
      entity: "attendance",
      entityId: `${date}-${class_name}`,
      schoolId: school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
      metadata: { date, class_name, recordCount: records.length, stats },
    });

    // Auto-notify for late arrivals
    const lateRecords = records.filter((r) => r.status === "late");
    if (lateRecords.length > 0) {
      try {
        const students = await Student.find({
          _id: { $in: lateRecords.map((r) => r.student_id) },
        }).lean();
        const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

        for (const lr of lateRecords) {
          const student = studentMap.get(lr.student_id);
          if (student) {
            await Notification.create({
              school: school_id,
              type: "late_alert",
              title: `Late Arrival: ${student.name}`,
              message: `${student.name} (Roll: ${student.roll_number}, Class: ${class_name}) arrived late on ${date}. Parent Contact: ${student.parent_phone || "N/A"}`,
              target_role: "admin",
              status: "unread",
            });
          }
        }
      } catch (e) {
        console.error("Failed to send late notifications:", e);
      }
    }

    // Auto-notify for absent students
    const absentRecords = records.filter((r) => r.status === "absent");
    if (absentRecords.length > 0) {
      try {
        const students = await Student.find({
          _id: { $in: absentRecords.map((r) => r.student_id) },
        }).lean();
        const absentNames = students.map((s) => s.name).join(", ");

        await Notification.create({
          school: school_id,
          type: "absent_alert",
          title: `${absentRecords.length} Absent in ${class_name}`,
          message: `Students absent on ${date}: ${absentNames}`,
          target_role: "admin",
          status: "unread",
        });
      } catch (e) {
        console.error("Failed to send absent notifications:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Attendance saved successfully",
      stats,
    });
  } catch (error) {
    logError("POST", "/api/attendance", error);
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 },
    );
  }
}
