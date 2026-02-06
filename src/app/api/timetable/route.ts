import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Timetable from "@/lib/models/Timetable";
import { requireAuth } from "@/lib/permissions";
import { timetableSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { logError } from "@/lib/logger";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("timetable:read");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const className = searchParams.get("class");
    const day = searchParams.get("day");
    const teacher = searchParams.get("teacher");

    await connectDB();

    const query: Record<string, unknown> = { school: session!.user.school_id };
    if (className) query.class_name = className;
    if (day) query.day = day;
    if (teacher) query.teacher_name = { $regex: teacher, $options: "i" };

    const entries = await Timetable.find(query)
      .sort({ day: 1, period: 1 })
      .lean();

    const data = entries.map((t) => ({
      timetable_id: t._id.toString(),
      school_id: t.school.toString(),
      class_name: t.class_name,
      day: t.day,
      period: t.period,
      subject: t.subject,
      teacher_name: t.teacher_name || "",
      start_time: t.start_time || "",
      end_time: t.end_time || "",
      room: t.room || "",
    }));

    data.sort((a, b) => {
      const da = DAY_ORDER.indexOf(a.day);
      const db = DAY_ORDER.indexOf(b.day);
      if (da !== db) return da - db;
      return a.period - b.period;
    });

    const byDay: Record<string, typeof data> = {};
    for (const entry of data) {
      if (!byDay[entry.day]) byDay[entry.day] = [];
      byDay[entry.day].push(entry);
    }

    const classes = Array.from(new Set(data.map((d) => d.class_name))).sort();

    return NextResponse.json({ data, byDay, classes });
  } catch (error) {
    logError("GET", "/api/timetable", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("timetable:write");
    if (error) return error;

    const body = await request.json();
    const parsed = timetableSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const {
      class_name,
      day,
      period,
      subject,
      teacher_name,
      start_time,
      end_time,
      room,
      teacher_id,
    } = parsed.data;

    await connectDB();

    const slotConflict = await Timetable.findOne({
      school: session!.user.school_id,
      class_name,
      day,
      period: Number(period),
    });
    if (slotConflict) {
      return NextResponse.json(
        { error: "This time slot is already occupied for this class" },
        { status: 409 },
      );
    }

    if (teacher_name) {
      const teacherConflict = await Timetable.findOne({
        school: session!.user.school_id,
        teacher_name: { $regex: `^${teacher_name}$`, $options: "i" },
        day,
        period: Number(period),
      });
      if (teacherConflict) {
        return NextResponse.json(
          {
            error: `${teacher_name} already has a class (${teacherConflict.class_name}) in this slot`,
          },
          { status: 409 },
        );
      }
    }

    const entry = await Timetable.create({
      school: session!.user.school_id,
      class_name,
      day,
      period: Number(period),
      subject,
      teacher_id: teacher_id || "",
      teacher_name: teacher_name || "",
      start_time: start_time || "",
      end_time: end_time || "",
      room: room || "",
    });

    await audit({
      action: "create",
      entity: "timetable",
      entityId: entry._id.toString(),
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
    });

    return NextResponse.json({
      message: "Timetable entry added",
      data: { timetable_id: entry._id.toString() },
    });
  } catch (error) {
    logError("POST", "/api/timetable", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("timetable:write");
    if (error) return error;

    const body = await request.json();
    const { timetable_id, subject, teacher_name, start_time, end_time, room } =
      body;

    if (!timetable_id) {
      return NextResponse.json(
        { error: "timetable_id is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const update: Record<string, unknown> = {};
    if (subject) update.subject = subject;
    if (teacher_name !== undefined) update.teacher_name = teacher_name;
    if (start_time !== undefined) update.start_time = start_time;
    if (end_time !== undefined) update.end_time = end_time;
    if (room !== undefined) update.room = room;

    const result = await Timetable.findOneAndUpdate(
      { _id: timetable_id, school: session!.user.school_id },
      update,
      { new: true },
    );

    if (!result) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await audit({
      action: "update",
      entity: "timetable",
      entityId: timetable_id,
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
    });

    return NextResponse.json({ message: "Timetable entry updated" });
  } catch (error) {
    logError("PUT", "/api/timetable", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("timetable:delete");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const timetable_id = searchParams.get("timetable_id");

    if (!timetable_id) {
      return NextResponse.json(
        { error: "timetable_id is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const result = await Timetable.findOneAndDelete({
      _id: timetable_id,
      school: session!.user.school_id,
    });

    if (!result) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    await audit({
      action: "delete",
      entity: "timetable",
      entityId: timetable_id,
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
      metadata: {
        deletedEntry: `${result.class_name} ${result.day} P${result.period}`,
      },
    });

    return NextResponse.json({ message: "Timetable entry deleted" });
  } catch (error) {
    logError("DELETE", "/api/timetable", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
