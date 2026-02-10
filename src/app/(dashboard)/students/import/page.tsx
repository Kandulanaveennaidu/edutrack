"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileSpreadsheet, Download, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showSuccess, showError } from "@/lib/alerts";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ParsedStudent {
  name: string;
  roll_number: string;
  class_name: string;
  parent_name: string;
  parent_phone: string;
  email: string;
  address: string;
}

export default function ImportStudentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrors([]);
    setParsedData([]);

    try {
      const reader = new FileReader();

      reader.onload = async (event) => {
        const text = event.target?.result as string;

        // Parse CSV
        if (file.name.endsWith(".csv")) {
          const lines = text.split("\n");
          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().toLowerCase());

          const data: ParsedStudent[] = [];
          const parseErrors: string[] = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(",").map((v) => v.trim());
            const student: ParsedStudent = {
              name: values[headers.indexOf("name")] || "",
              roll_number:
                values[headers.indexOf("roll_number")] ||
                values[headers.indexOf("roll")] ||
                "",
              class_name:
                values[headers.indexOf("class_name")] ||
                values[headers.indexOf("class")] ||
                "",
              parent_name:
                values[headers.indexOf("parent_name")] ||
                values[headers.indexOf("parent")] ||
                "",
              parent_phone:
                values[headers.indexOf("parent_phone")] ||
                values[headers.indexOf("phone")] ||
                "",
              email: values[headers.indexOf("email")] || "",
              address: values[headers.indexOf("address")] || "",
            };

            if (!student.name || !student.roll_number || !student.class_name) {
              parseErrors.push(
                `Row ${i + 1}: Missing required fields (name, roll_number, class_name)`,
              );
            } else {
              data.push(student);
            }
          }

          setParsedData(data);
          setErrors(parseErrors);
        } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
          // Use xlsx library for Excel files
          const XLSX = await import("xlsx");
          const workbook = XLSX.read(text, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const data: ParsedStudent[] = [];
          const parseErrors: string[] = [];

          (jsonData as Record<string, unknown>[]).forEach((row, index) => {
            const student: ParsedStudent = {
              name: String(row.name || row.Name || ""),
              roll_number: String(
                row.roll_number || row.Roll || row.RollNumber || "",
              ),
              class_name: String(
                row.class_name || row.Class || row.ClassName || "",
              ),
              parent_name: String(
                row.parent_name || row.Parent || row.ParentName || "",
              ),
              parent_phone: String(
                row.parent_phone || row.Phone || row.ParentPhone || "",
              ),
              email: String(row.email || row.Email || ""),
              address: String(row.address || row.Address || ""),
            };

            if (!student.name || !student.roll_number || !student.class_name) {
              parseErrors.push(`Row ${index + 2}: Missing required fields`);
            } else {
              data.push(student);
            }
          });

          setParsedData(data);
          setErrors(parseErrors);
        } else {
          showError("Error", "Please upload a CSV or Excel file");
        }

        setLoading(false);
      };

      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    } catch {
      setLoading(false);
      showError("Error", "Failed to parse file");
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    let successCount = 0;
    let failCount = 0;

    for (const student of parsedData) {
      try {
        const response = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(student),
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setImporting(false);
    if (successCount > 0) {
      showSuccess(
        "Import Complete",
        `Successfully imported ${successCount} students. ${failCount} failed.`,
      );
    } else {
      showError(
        "Import Complete",
        `Successfully imported ${successCount} students. ${failCount} failed.`,
      );
    }

    if (successCount > 0) {
      router.push("/students");
    }
  };

  const downloadTemplate = () => {
    const headers =
      "name,roll_number,class_name,parent_name,parent_phone,email,address";
    const sampleRow =
      "John Doe,101,Class 5,Jane Doe,9876543210,john@example.com,123 Main St";
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${sampleRow}`;

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Import Students
          </h1>
          <p className="text-slate-500">
            Bulk import students from CSV or Excel
          </p>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Upload a CSV or Excel file with student data. Required columns:
            name, roll_number, class_name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 p-12">
            <FileSpreadsheet className="mb-4 h-12 w-12 text-slate-400" />
            <p className="mb-4 text-sm text-slate-500">
              Drag and drop your file here, or click to browse
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card>
          <CardContent className="flex h-32 items-center justify-center">
            <Spinner />
            <span className="ml-2">Parsing file...</span>
          </CardContent>
        </Card>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Parsing Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc text-sm text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {parsedData.length} students ready to import
                </CardDescription>
              </div>
              <Button onClick={handleImport} disabled={importing}>
                {importing ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import All
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.slice(0, 10).map((student, index) => (
                  <TableRow key={index}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.roll_number}</TableCell>
                    <TableCell>{student.class_name}</TableCell>
                    <TableCell>{student.parent_name || "-"}</TableCell>
                    <TableCell>{student.parent_phone || "-"}</TableCell>
                    <TableCell>{student.email || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {parsedData.length > 10 && (
              <p className="mt-4 text-center text-sm text-slate-500">
                Showing first 10 of {parsedData.length} students
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
