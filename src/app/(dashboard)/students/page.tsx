"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Upload,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { StudentForm } from "@/components/students/student-form";
import Link from "next/link";

interface Student {
  student_id: string;
  school_id: string;
  class_name: string;
  roll_number: string;
  name: string;
  parent_name: string;
  parent_phone: string;
  email: string;
  address: string;
  admission_date: string;
  status: string;
}

export default function StudentsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  const classes = [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
  ];

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
        ...(className && { class_name: className }),
      });
      const response = await fetch(`/api/students?${params}`);
      if (response.ok) {
        const result = await response.json();
        setStudents(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch students",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [page, search, className]);

  const handleAddStudent = () => {
    setEditingStudent(null);
    setDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setDialogOpen(true);
  };

  const handleDeleteClick = (student: Student) => {
    setDeletingStudent(student);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;

    setSaving(true);
    try {
      const response = await fetch(
        `/api/students/${deletingStudent.student_id}`,
        {
          method: "DELETE",
        },
      );
      if (response.ok) {
        toast({
          variant: "success",
          title: "Success",
          description: "Student deleted successfully",
        });
        fetchStudents();
      } else {
        throw new Error("Failed to delete");
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete student",
      });
    } finally {
      setSaving(false);
      setDeleteDialogOpen(false);
      setDeletingStudent(null);
    }
  };

  const handleFormSubmit = async (data: Partial<Student>) => {
    setSaving(true);
    try {
      const url = editingStudent
        ? `/api/students/${editingStudent.student_id}`
        : "/api/students";
      const method = editingStudent ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          variant: "success",
          title: "Success",
          description: editingStudent
            ? "Student updated successfully"
            : "Student added successfully",
        });
        setDialogOpen(false);
        fetchStudents();
      } else {
        const result = await response.json();
        throw new Error(result.error || "Failed to save");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save student",
      });
    } finally {
      setSaving(false);
    }
  };

  const exportToPDF = () => {
    // Simple PDF export using jsPDF
    import("jspdf").then(({ default: jsPDF }) => {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Student List", 20, 20);

      let y = 40;
      doc.setFontSize(10);
      doc.text("Roll No | Name | Class | Parent Phone | Status", 20, 30);

      students.forEach((student) => {
        doc.text(
          `${student.roll_number} | ${student.name} | ${student.class_name} | ${student.parent_phone} | ${student.status}`,
          20,
          y,
        );
        y += 10;
      });

      doc.save("students.pdf");
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Students</h1>
          <p className="text-slate-500">Manage student records</p>
        </div>
        <div className="flex gap-2">
          <Link href="/students/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </Link>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button onClick={handleAddStudent}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or roll number..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* Class Filter */}
            <Select
              value={className}
              onValueChange={(value) => {
                setClassName(value === "all" ? "" : value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student List</CardTitle>
          <CardDescription>{students.length} students found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Spinner />
            </div>
          ) : students.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-slate-500">
              No students found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Parent Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.student_id}>
                      <TableCell className="font-medium">
                        {student.roll_number}
                      </TableCell>
                      <TableCell>{student.name}</TableCell>
                      <TableCell>{student.class_name}</TableCell>
                      <TableCell>{student.parent_phone || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === "active"
                              ? "success"
                              : "secondary"
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditStudent(student)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(student)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Student" : "Add Student"}
            </DialogTitle>
            <DialogDescription>
              {editingStudent
                ? "Update student information"
                : "Enter the details for the new student"}
            </DialogDescription>
          </DialogHeader>
          <StudentForm
            initialData={editingStudent || undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setDialogOpen(false)}
            loading={saving}
            classes={classes}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingStudent?.name}? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
