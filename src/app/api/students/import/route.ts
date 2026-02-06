import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Student from "@/lib/models/Student";
import { requireRole } from "@/lib/permissions";
import { audit } from "@/lib/audit";
import { logError } from "@/lib/logger";
import { formatDateForStorage } from "@/lib/utils";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireRole("admin");
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
      "text/csv",
    ];
    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(xlsx|xls|csv)$/i)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid file type. Only .xlsx, .xls, and .csv files are supported",
        },
        { status: 400 },
      );
    }

    // Max file size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

    if (!rawData || rawData.length === 0) {
      return NextResponse.json(
        { error: "File is empty or has no data rows" },
        { status: 400 },
      );
    }

    // Max 500 students per import
    if (rawData.length > 500) {
      return NextResponse.json(
        {
          error:
            "Maximum 500 students per import. Please split into smaller files.",
        },
        { status: 400 },
      );
    }

    // Column mapping (flexible: supports various header names)
    const columnMap: Record<string, string[]> = {
      name: ["name", "student_name", "student name", "full name", "fullname"],
      class_name: [
        "class_name",
        "class",
        "className",
        "grade",
        "section",
        "class name",
      ],
      roll_number: [
        "roll_number",
        "roll",
        "rollno",
        "roll no",
        "roll_no",
        "roll number",
      ],
      parent_name: [
        "parent_name",
        "parent",
        "father_name",
        "guardian",
        "parent name",
        "father name",
      ],
      parent_phone: [
        "parent_phone",
        "phone",
        "contact",
        "mobile",
        "parent phone",
        "parent_mobile",
      ],
      email: ["email", "student_email", "mail", "student email"],
      address: ["address", "addr", "location"],
    };

    const findColumn = (
      row: Record<string, string>,
      candidates: string[],
    ): string => {
      for (const key of Object.keys(row)) {
        if (candidates.includes(key.toLowerCase().trim())) {
          return key;
        }
      }
      return "";
    };

    const firstRow = rawData[0];
    const mappedColumns: Record<string, string> = {};
    for (const [field, candidates] of Object.entries(columnMap)) {
      mappedColumns[field] = findColumn(firstRow, candidates);
    }

    // Validate required columns
    if (
      !mappedColumns.name ||
      !mappedColumns.class_name ||
      !mappedColumns.roll_number
    ) {
      return NextResponse.json(
        {
          error:
            "File must have columns: name/student_name, class/class_name, roll_number/roll. Found columns: " +
            Object.keys(firstRow).join(", "),
        },
        { status: 400 },
      );
    }

    await connectDB();

    const school_id = session!.user.school_id;
    const results = { imported: 0, skipped: 0, errors: [] as string[] };
    const admissionDate = formatDateForStorage(new Date());

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const name = String(row[mappedColumns.name] || "").trim();
      const class_name = String(row[mappedColumns.class_name] || "").trim();
      const roll_number = String(row[mappedColumns.roll_number] || "").trim();

      if (!name || !class_name || !roll_number) {
        results.errors.push(
          `Row ${i + 2}: Missing required field (name/class/roll)`,
        );
        results.skipped++;
        continue;
      }

      // Check for duplicate
      const existing = await Student.findOne({
        school: school_id,
        class_name,
        roll_number,
        status: "active",
      });

      if (existing) {
        results.errors.push(
          `Row ${i + 2}: Roll ${roll_number} already exists in ${class_name}`,
        );
        results.skipped++;
        continue;
      }

      try {
        await Student.create({
          school: school_id,
          name,
          class_name,
          roll_number,
          parent_name: mappedColumns.parent_name
            ? String(row[mappedColumns.parent_name] || "").trim()
            : "",
          parent_phone: mappedColumns.parent_phone
            ? String(row[mappedColumns.parent_phone] || "").trim()
            : "",
          email: mappedColumns.email
            ? String(row[mappedColumns.email] || "").trim()
            : "",
          address: mappedColumns.address
            ? String(row[mappedColumns.address] || "").trim()
            : "",
          admission_date: admissionDate,
          status: "active",
        });
        results.imported++;
      } catch (err) {
        results.errors.push(
          `Row ${i + 2}: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
        results.skipped++;
      }
    }

    await audit({
      action: "import",
      entity: "student",
      entityId: "bulk",
      schoolId: school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
      metadata: {
        fileName: file.name,
        totalRows: rawData.length,
        imported: results.imported,
        skipped: results.skipped,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Import complete: ${results.imported} added, ${results.skipped} skipped`,
      data: results,
    });
  } catch (error) {
    logError("POST", "/api/students/import", error);
    return NextResponse.json(
      { error: "Failed to import students" },
      { status: 500 },
    );
  }
}
