import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Student from "@/lib/models/Student";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 },
      );
    }

    await connectDB();

    const student = await Student.findById(id).lean();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Security check - ensure student belongs to the same school
    if (
      student.school.toString() !== session.user.school_id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        student_id: student._id.toString(),
        school_id: student.school.toString(),
        class_name: student.class_name,
        roll_number: student.roll_number,
        name: student.name,
        parent_name: student.parent_name || "",
        parent_phone: student.parent_phone || "",
        parent_email: student.parent_email || "",
        email: student.email || "",
        address: student.address || "",
        admission_date: student.admission_date || "",
        status: student.status,
      },
    });
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 },
      );
    }

    const body = await request.json();

    await connectDB();

    const student = await Student.findById(id);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Security check
    if (
      student.school.toString() !== session.user.school_id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for duplicate roll number if changed
    if (body.roll_number && body.roll_number !== student.roll_number) {
      const duplicate = await Student.findOne({
        school: student.school,
        class_name: body.class_name || student.class_name,
        roll_number: body.roll_number,
        _id: { $ne: student._id },
        status: "active",
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Roll number already exists in this class" },
          { status: 400 },
        );
      }
    }

    // Update fields
    if (body.class_name) student.class_name = body.class_name;
    if (body.roll_number) student.roll_number = body.roll_number;
    if (body.name) student.name = body.name;
    if (body.parent_name !== undefined) student.parent_name = body.parent_name;
    if (body.parent_phone !== undefined)
      student.parent_phone = body.parent_phone;
    if (body.parent_email !== undefined)
      student.parent_email = body.parent_email;
    if (body.email !== undefined) student.email = body.email;
    if (body.address !== undefined) student.address = body.address;
    if (body.status) student.status = body.status;

    await student.save();

    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      data: {
        student_id: student._id.toString(),
        school_id: student.school.toString(),
        class_name: student.class_name,
        roll_number: student.roll_number,
        name: student.name,
        parent_name: student.parent_name || "",
        parent_phone: student.parent_phone || "",
        parent_email: student.parent_email || "",
        email: student.email || "",
        address: student.address || "",
        admission_date: student.admission_date || "",
        status: student.status,
      },
    });
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid student ID" },
        { status: 400 },
      );
    }

    await connectDB();

    const student = await Student.findById(id);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Security check
    if (
      student.school.toString() !== session.user.school_id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete - update status to inactive
    student.status = "inactive";
    await student.save();

    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 },
    );
  }
}
