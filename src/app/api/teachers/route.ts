import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { requireAuth, requireRole } from "@/lib/permissions";
import {
  teacherSchema,
  updateTeacherSchema,
  validationError,
} from "@/lib/validators";
import { audit, buildChanges } from "@/lib/audit";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("teachers:read");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50")),
    );
    const search = searchParams.get("search");

    await connectDB();

    const filter: Record<string, unknown> = {
      school: session!.user.school_id,
      role: "teacher",
    };
    if (search) {
      const { escapeRegex } = await import("@/lib/utils");
      const safe = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    const [teachers, total] = await Promise.all([
      User.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const data = teachers.map((t) => ({
      teacher_id: t._id.toString(),
      school_id: t.school.toString(),
      name: t.name,
      email: t.email,
      phone: t.phone || "",
      subject: t.subject || "",
      classes: t.classes?.join(", ") || "",
      salary_per_day: t.salaryPerDay || "",
      joining_date: t.joiningDate
        ? new Date(t.joiningDate).toISOString().split("T")[0]
        : "",
      role: "teacher",
      status: t.isActive ? "active" : "inactive",
    }));

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logError("GET", "/api/teachers", error);
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
    const parsed = teacherSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { name, email, password, phone, subject, classes, salary_per_day } =
      parsed.data;

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: "A teacher with this email already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const teacher = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "teacher",
      school: session!.user.school_id,
      phone: phone || "",
      subject: subject || "",
      classes: classes
        ? String(classes)
            .split(",")
            .map((c: string) => c.trim())
        : [],
      salaryPerDay: salary_per_day ? Number(salary_per_day) : undefined,
      joiningDate: new Date(),
      isActive: true,
      emailVerified: true,
    });

    await audit({
      action: "create",
      entity: "teacher",
      entityId: teacher._id.toString(),
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
    });

    return NextResponse.json({
      message: "Teacher added successfully",
      data: { teacher_id: teacher._id.toString() },
    });
  } catch (error) {
    logError("POST", "/api/teachers", error);
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
    const parsed = updateTeacherSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const {
      teacher_id,
      name,
      phone,
      subject,
      classes,
      salary_per_day,
      status,
    } = parsed.data;

    await connectDB();

    const teacher = await User.findOne({
      _id: teacher_id,
      school: session!.user.school_id,
      role: "teacher",
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    const oldData = {
      name: teacher.name,
      phone: teacher.phone,
      subject: teacher.subject,
      classes: teacher.classes?.join(", "),
      salaryPerDay: teacher.salaryPerDay,
      isActive: teacher.isActive,
    };

    if (name) teacher.name = name;
    if (phone !== undefined) teacher.phone = phone;
    if (subject !== undefined) teacher.subject = subject;
    if (classes !== undefined)
      teacher.classes = String(classes)
        .split(",")
        .map((c: string) => c.trim());
    if (salary_per_day !== undefined)
      teacher.salaryPerDay = Number(salary_per_day);
    if (status) teacher.isActive = status === "active";

    await teacher.save();

    const changes = buildChanges(
      oldData as Record<string, unknown>,
      {
        name,
        phone,
        subject,
        classes,
        salaryPerDay: salary_per_day,
        isActive: status === "active",
      },
      ["name", "phone", "subject", "classes", "salaryPerDay", "isActive"],
    );

    await audit({
      action: "update",
      entity: "teacher",
      entityId: teacher_id,
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
      changes,
    });

    return NextResponse.json({
      message: "Teacher updated",
      data: {
        teacher_id: teacher._id.toString(),
        school_id: teacher.school.toString(),
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone || "",
        subject: teacher.subject || "",
        classes: teacher.classes?.join(", ") || "",
        salary_per_day: teacher.salaryPerDay || "",
        role: "teacher",
        status: teacher.isActive ? "active" : "inactive",
      },
    });
  } catch (error) {
    logError("PUT", "/api/teachers", error);
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
    const teacherId = searchParams.get("teacher_id");
    if (!teacherId) {
      return NextResponse.json(
        { error: "teacher_id is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const result = await User.findOneAndUpdate(
      {
        _id: teacherId,
        school: session!.user.school_id,
        role: "teacher",
      },
      { $set: { isActive: false } },
      { new: true },
    );

    if (!result) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    await audit({
      action: "delete",
      entity: "teacher",
      entityId: teacherId,
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
      metadata: { deactivatedTeacher: result.name },
    });

    return NextResponse.json({ message: "Teacher deactivated" });
  } catch (error) {
    logError("DELETE", "/api/teachers", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
