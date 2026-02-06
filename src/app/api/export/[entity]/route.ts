import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/lib/models/Student";
import User from "@/lib/models/User";
import Attendance from "@/lib/models/Attendance";
import LeaveRequest from "@/lib/models/LeaveRequest";
import Visitor from "@/lib/models/Visitor";
import Holiday from "@/lib/models/Holiday";
import { requireAuth } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { logError } from "@/lib/logger";

type EntityType =
  | "students"
  | "teachers"
  | "attendance"
  | "leaves"
  | "visitors"
  | "holidays";

function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (val: unknown): string => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.join(",")];
  for (const row of rows) {
    const values = headers.map((h) => escape(row[h]));
    lines.push(values.join(","));
  }
  return lines.join("\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entity: string }> },
) {
  try {
    const { error, session } = await requireAuth("reports:read");
    if (error) return error;

    const { entity } = await params;
    const schoolId = session!.user.school_id;
    const { searchParams } = new URL(request.url);

    await connectDB();

    let csv = "";
    let filename = "";

    switch (entity as EntityType) {
      case "students": {
        const query: Record<string, unknown> = {
          school: schoolId,
          status: "active",
        };
        const className = searchParams.get("class_name");
        if (className) query.class_name = className;

        const students = await Student.find(query)
          .sort({ class_name: 1, roll_number: 1 })
          .lean();
        const headers = [
          "name",
          "class_name",
          "roll_number",
          "parent_name",
          "parent_phone",
          "email",
          "address",
          "admission_date",
          "status",
        ];
        const rows = students.map((s) => ({
          name: s.name,
          class_name: s.class_name,
          roll_number: s.roll_number,
          parent_name: s.parent_name || "",
          parent_phone: s.parent_phone || "",
          email: s.email || "",
          address: s.address || "",
          admission_date: s.admission_date || "",
          status: s.status,
        }));
        csv = toCSV(headers, rows);
        filename = `students_${className || "all"}_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      case "teachers": {
        const teachers = await User.find({
          school: schoolId,
          role: "teacher",
        }).lean();
        const headers = [
          "name",
          "email",
          "phone",
          "subject",
          "classes",
          "salary_per_day",
          "joining_date",
          "status",
        ];
        const rows = teachers.map((t) => ({
          name: t.name,
          email: t.email,
          phone: t.phone || "",
          subject: t.subject || "",
          classes: t.classes?.join(", ") || "",
          salary_per_day: t.salaryPerDay || "",
          joining_date: t.joiningDate
            ? new Date(t.joiningDate).toISOString().split("T")[0]
            : "",
          status: t.isActive ? "active" : "inactive",
        }));
        csv = toCSV(headers, rows);
        filename = `teachers_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      case "attendance": {
        const date = searchParams.get("date");
        const className = searchParams.get("class_name");
        if (!date) {
          return NextResponse.json(
            { error: "date query param is required" },
            { status: 400 },
          );
        }

        const query: Record<string, unknown> = { date, school: schoolId };
        if (className) query.class_name = className;

        const records = await Attendance.find(query).lean();
        const studentIds = records.map((r) => r.student);
        const students = await Student.find({
          _id: { $in: studentIds },
        }).lean();
        const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

        const headers = [
          "date",
          "class_name",
          "student_name",
          "roll_number",
          "status",
          "marked_by",
          "marked_at",
          "notes",
        ];
        const rows = records.map((r) => {
          const student = studentMap.get(r.student.toString());
          return {
            date: r.date,
            class_name: r.class_name,
            student_name: student?.name || "",
            roll_number: student?.roll_number || "",
            status: r.status,
            marked_by: r.marked_by || "",
            marked_at: r.marked_at || "",
            notes: r.notes || "",
          };
        });
        csv = toCSV(headers, rows);
        filename = `attendance_${date}_${className || "all"}.csv`;
        break;
      }

      case "leaves": {
        const leaves = await LeaveRequest.find({ school: schoolId })
          .sort({ createdAt: -1 })
          .lean();
        const headers = [
          "student_name",
          "class_name",
          "from_date",
          "to_date",
          "reason",
          "status",
          "applied_at",
          "approved_by",
        ];
        const rows = leaves.map((l) => ({
          student_name: l.student_name || "",
          class_name: l.class_name || "",
          from_date: l.from_date,
          to_date: l.to_date,
          reason: l.reason,
          status: l.status,
          applied_at: l.applied_at || "",
          approved_by: l.approved_by || "",
        }));
        csv = toCSV(headers, rows);
        filename = `leaves_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      case "visitors": {
        const visitors = await Visitor.find({ school: schoolId })
          .sort({ createdAt: -1 })
          .lean();
        const headers = [
          "visitor_name",
          "visitor_phone",
          "purpose",
          "host_name",
          "check_in",
          "check_out",
          "badge_number",
          "status",
        ];
        const rows = visitors.map((v) => ({
          visitor_name: v.visitor_name,
          visitor_phone: v.visitor_phone || "",
          purpose: v.purpose,
          host_name: v.host_name || "",
          check_in: v.check_in || "",
          check_out: v.check_out || "",
          badge_number: v.badge_number || "",
          status: v.status,
        }));
        csv = toCSV(headers, rows);
        filename = `visitors_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      case "holidays": {
        const holidays = await Holiday.find({ school: schoolId })
          .sort({ date: 1 })
          .lean();
        const headers = ["date", "name", "description", "holiday_type"];
        const rows = holidays.map((h) => ({
          date: h.date,
          name: h.name,
          description: h.description || "",
          holiday_type: h.holiday_type,
        }));
        csv = toCSV(headers, rows);
        filename = `holidays_${new Date().toISOString().split("T")[0]}.csv`;
        break;
      }

      default:
        return NextResponse.json(
          {
            error:
              "Invalid entity. Supported: students, teachers, attendance, leaves, visitors, holidays",
          },
          { status: 400 },
        );
    }

    await audit({
      action: "export",
      entity: entity,
      entityId: "csv",
      schoolId,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
      metadata: { filename },
    });

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    logError("GET", "/api/export", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
