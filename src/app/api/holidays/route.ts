import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Holiday from "@/lib/models/Holiday";
import { requireAuth, requireRole } from "@/lib/permissions";
import { holidaySchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("holidays:read");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const type = searchParams.get("type");

    await connectDB();

    const query: Record<string, unknown> = { school: session!.user.school_id };

    if (month) {
      const startDate = `${month}-01`;
      const [y, m] = month.split("-").map(Number);
      const lastDay = new Date(y, m, 0).getDate();
      const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (type) query.holiday_type = type;

    const holidays = await Holiday.find(query).sort({ date: 1 }).lean();

    const data = holidays.map((h) => ({
      holiday_id: h._id.toString(),
      school_id: h.school.toString(),
      date: h.date,
      name: h.name,
      description: h.description || "",
      holiday_type: h.holiday_type,
      created_by: h.created_by?.toString() || "",
    }));

    const byMonth: Record<string, typeof data> = {};
    for (const h of data) {
      const m = h.date.substring(0, 7);
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(h);
    }

    return NextResponse.json({ data, byMonth });
  } catch (error) {
    logError("GET", "/api/holidays", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireRole("admin");
    if (error) return error;

    const body = await request.json();
    const parsed = holidaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { date, name, type, description } = parsed.data;

    await connectDB();

    const existing = await Holiday.findOne({
      school: session!.user.school_id,
      date,
    });
    if (existing) {
      return NextResponse.json(
        { error: "A holiday already exists for this date" },
        { status: 409 },
      );
    }

    const holiday = await Holiday.create({
      school: session!.user.school_id,
      date,
      name,
      description: description || "",
      holiday_type: type,
      created_by: session!.user.id,
    });

    await audit({
      action: "create",
      entity: "holiday",
      entityId: holiday._id.toString(),
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
    });

    return NextResponse.json({
      message: "Holiday added",
      data: { holiday_id: holiday._id.toString() },
    });
  } catch (error) {
    logError("POST", "/api/holidays", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, session } = await requireRole("admin");
    if (error) return error;

    const body = await request.json();
    const { holiday_id, name, description, holiday_type } = body;

    if (!holiday_id) {
      return NextResponse.json(
        { error: "holiday_id is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const update: Record<string, unknown> = {};
    if (name) update.name = name;
    if (description !== undefined) update.description = description;
    if (holiday_type) update.holiday_type = holiday_type;

    const result = await Holiday.findOneAndUpdate(
      { _id: holiday_id, school: session!.user.school_id },
      update,
      { new: true },
    );

    if (!result) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    await audit({
      action: "update",
      entity: "holiday",
      entityId: holiday_id,
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
    });

    return NextResponse.json({ message: "Holiday updated" });
  } catch (error) {
    logError("PUT", "/api/holidays", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { error, session } = await requireRole("admin");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const holiday_id = searchParams.get("holiday_id");

    if (!holiday_id) {
      return NextResponse.json(
        { error: "holiday_id is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const result = await Holiday.findOneAndDelete({
      _id: holiday_id,
      school: session!.user.school_id,
    });

    if (!result) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    await audit({
      action: "delete",
      entity: "holiday",
      entityId: holiday_id,
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
      metadata: { deletedHoliday: result.name },
    });

    return NextResponse.json({ message: "Holiday deleted" });
  } catch (error) {
    logError("DELETE", "/api/holidays", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
