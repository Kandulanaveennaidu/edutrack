"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Upload,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError, showConfirm } from "@/lib/alerts";
import { Spinner } from "@/components/ui/spinner";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocale } from "@/hooks/use-locale";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  subject: string;
  class_name: string;
  section: string;
  teacher: { _id: string; name: string; email: string } | null;
  dueDate: string;
  status: "active" | "closed";
  maxMarks: number;
  submissionCount: number;
  createdAt: string;
}

interface Submission {
  student: {
    _id: string;
    name: string;
    rollNumber?: string;
    class_name?: string;
  } | null;
  submittedAt: string;
  content: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: { _id: string; name: string } | null;
}

interface AssignmentDetail extends Omit<Assignment, "submissionCount"> {
  submissions: Submission[];
}

function getDueDateStatus(dueDate: string) {
  const now = new Date();
  const due = new Date(dueDate);
  const diff = due.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);

  if (diff < 0)
    return {
      label: "overdue" as const,
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: AlertCircle,
    };
  if (days <= 2)
    return {
      label: "dueSoon" as const,
      color:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      icon: Clock,
    };
  return {
    label: "upcoming" as const,
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  };
}

export default function AssignmentsPage() {
  const { t } = useLocale();
  const { data: sessionData } = useSession();
  const { canAdd, canEdit, canDelete } = usePermissions("exams");
  const isStudent = sessionData?.user?.role === "student";
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitAssignmentId, setSubmitAssignmentId] = useState<string | null>(
    null,
  );
  const [submitForm, setSubmitForm] = useState({
    content: "",
    attachments: [] as string[],
  });
  const [uploading, setUploading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AssignmentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    class_name: "",
    section: "",
    dueDate: "",
    maxMarks: 100,
  });

  // Grading
  const [gradeForm, setGradeForm] = useState({
    student_id: "",
    studentName: "",
    grade: 0,
    feedback: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterClass) params.set("class_name", filterClass);
      if (filterSubject) params.set("subject", filterSubject);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/assignments?${params}`);
      if (res.ok) {
        const d = await res.json();
        setAssignments(d.data || []);
      }
    } catch {
      showError(t("common.error"), t("assignments.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [filterClass, filterSubject, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm({
      title: "",
      description: "",
      subject: "",
      class_name: "",
      section: "",
      dueDate: "",
      maxMarks: 100,
    });
    setShowDialog(true);
  };

  const openEdit = (a: Assignment) => {
    setEditId(a._id);
    setForm({
      title: a.title,
      description: a.description,
      subject: a.subject,
      class_name: a.class_name,
      section: a.section || "",
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : "",
      maxMarks: a.maxMarks,
    });
    setShowDialog(true);
  };

  const save = async () => {
    if (!form.title || !form.subject || !form.class_name || !form.dueDate) {
      showError(t("assignments.validation"), t("assignments.validationError"));
      return;
    }
    try {
      setSubmitting(true);
      const method = editId ? "PUT" : "POST";
      const url = editId ? `/api/assignments/${editId}` : "/api/assignments";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        showSuccess(
          t("common.success"),
          editId
            ? t("assignments.assignmentUpdated")
            : t("assignments.assignmentCreated"),
        );
        setShowDialog(false);
        setEditId(null);
        fetchData();
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("assignments.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAssignment = async (id: string) => {
    const confirmed = await showConfirm(
      t("assignments.deleteConfirmTitle"),
      t("assignments.deleteConfirmMessage"),
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess(t("assignments.deleted"), t("assignments.deletedSuccess"));
        fetchData();
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("assignments.deleteError"));
    }
  };

  const viewDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setShowDetailDialog(true);
      const res = await fetch(`/api/assignments/${id}`);
      if (res.ok) {
        const d = await res.json();
        setDetail(d.data);
      } else {
        showError(t("common.error"), t("assignments.loadError"));
        setShowDetailDialog(false);
      }
    } catch {
      showError(t("common.error"), t("assignments.loadError"));
      setShowDetailDialog(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const openGradeDialog = (sub: Submission) => {
    setGradeForm({
      student_id: sub.student?._id || "",
      studentName: sub.student?.name || t("assignments.unknown"),
      grade: sub.grade || 0,
      feedback: sub.feedback || "",
    });
    setShowGradeDialog(true);
  };

  const submitGrade = async () => {
    if (!detail) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/assignments/${detail._id}/submit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gradeForm),
      });
      if (res.ok) {
        showSuccess(t("assignments.graded"), t("assignments.gradedSuccess"));
        setShowGradeDialog(false);
        // Refresh detail
        viewDetail(detail._id);
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("assignments.gradeError"));
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitDialog = (assignmentId: string) => {
    setSubmitAssignmentId(assignmentId);
    setSubmitForm({ content: "", attachments: [] });
    setShowSubmitDialog(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.data?.url;
        if (url) {
          setSubmitForm((prev) => ({
            ...prev,
            attachments: [...prev.attachments, url],
          }));
          showSuccess(
            t("assignments.uploaded"),
            t("assignments.uploadedSuccess"),
          );
        }
      } else {
        showError(t("assignments.uploadFailed"), t("assignments.uploadError"));
      }
    } catch {
      showError(t("assignments.uploadFailed"), t("assignments.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const submitAssignment = async () => {
    if (!submitAssignmentId || !sessionData?.user?.id) return;
    if (!submitForm.content && submitForm.attachments.length === 0) {
      showError(t("assignments.validation"), t("assignments.answerRequired"));
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/assignments/${submitAssignmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: sessionData.user.id,
          content: submitForm.content,
          attachments: submitForm.attachments,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showSuccess(
          t("assignments.submitted"),
          data.message || t("assignments.homeworkSubmitted"),
        );
        setShowSubmitDialog(false);
        fetchData();
      } else {
        showError(
          t("common.error"),
          data.error || t("assignments.submitError"),
        );
      }
    } catch {
      showError(t("common.error"), t("assignments.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("nav.assignments")}
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            {t("assignments.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filterClass || undefined}
            onValueChange={(v) => setFilterClass(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("assignments.allClasses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {t("assignments.allClasses")}
              </SelectItem>
              {Array.from(new Set(assignments.map((a) => a.class_name)))
                .filter(Boolean)
                .map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={filterStatus || undefined}
            onValueChange={(v) => setFilterStatus(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("assignments.allStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {t("assignments.allStatus")}
              </SelectItem>
              <SelectItem value="active">{t("common.active")}</SelectItem>
              <SelectItem value="closed">{t("assignments.closed")}</SelectItem>
            </SelectContent>
          </Select>

          {canAdd && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("assignments.newAssignment")}
            </Button>
          )}
        </div>
      </div>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("assignments.title")}</TableHead>
                <TableHead>{t("assignments.subject")}</TableHead>
                <TableHead>{t("assignments.class")}</TableHead>
                <TableHead>{t("assignments.dueDate")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("assignments.submissions")}</TableHead>
                <TableHead>{t("assignments.maxMarks")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-10"
                  >
                    <FileText className="mx-auto h-10 w-10 mb-2 text-slate-300 dark:text-muted-foreground" />
                    {t("assignments.noAssignmentsFound")}
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((a) => {
                  const dueStat = getDueDateStatus(a.dueDate);
                  const DueIcon = dueStat.icon;
                  return (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{a.subject}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {a.class_name}
                          {a.section ? ` - ${a.section}` : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${dueStat.color}`}
                        >
                          <DueIcon className="h-3 w-3" />
                          {t(`assignments.${dueStat.label}`)}{" "}
                          {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "active" ? "default" : "secondary"
                          }
                        >
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          {a.submissionCount}
                        </span>
                      </TableCell>
                      <TableCell>{a.maxMarks}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title={t("common.view")}
                            onClick={() => viewDetail(a._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {isStudent && a.status === "active" && (
                            <Button
                              size="sm"
                              variant="default"
                              title={t("assignments.submitHomework")}
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => openSubmitDialog(a._id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              {t("common.submit")}
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title={t("common.edit")}
                              onClick={() => openEdit(a)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title={t("common.delete")}
                              onClick={() => deleteAssignment(a._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId
                ? t("assignments.editAssignment")
                : t("assignments.createAssignment")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t("assignments.titleRequired")}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={t("assignments.titlePlaceholder")}
              />
            </div>
            <div>
              <Label>{t("common.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder={t("assignments.descriptionPlaceholder")}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("assignments.subjectRequired")}</Label>
                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder={t("assignments.subjectPlaceholder")}
                />
              </div>
              <div>
                <Label>{t("assignments.classRequired")}</Label>
                <Input
                  value={form.class_name}
                  onChange={(e) =>
                    setForm({ ...form, class_name: e.target.value })
                  }
                  placeholder={t("assignments.classPlaceholder")}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("assignments.section")}</Label>
                <Input
                  value={form.section}
                  onChange={(e) =>
                    setForm({ ...form, section: e.target.value })
                  }
                  placeholder={t("assignments.sectionPlaceholder")}
                />
              </div>
              <div>
                <Label>{t("assignments.maxMarks")}</Label>
                <Input
                  type="number"
                  value={form.maxMarks}
                  onChange={(e) =>
                    setForm({ ...form, maxMarks: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div>
              <Label>{t("assignments.dueDateRequired")}</Label>
              <Input
                type="datetime-local"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <Button onClick={save} disabled={submitting} className="w-full">
              {submitting
                ? t("common.saving")
                : editId
                  ? t("assignments.updateAssignment")
                  : t("assignments.createAssignment")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail / Submissions Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("assignments.assignmentDetails")}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : detail ? (
            <div className="space-y-6 py-4">
              {/* Assignment info */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  {detail.title}
                </h3>
                {detail.description && (
                  <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                    {detail.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">{detail.subject}</Badge>
                  <Badge variant="secondary">
                    {detail.class_name}
                    {detail.section ? ` - ${detail.section}` : ""}
                  </Badge>
                  <Badge
                    variant={
                      detail.status === "active" ? "default" : "secondary"
                    }
                  >
                    {detail.status}
                  </Badge>
                  <span className="text-muted-foreground">
                    {t("assignments.dueLabel")}:{" "}
                    {new Date(detail.dueDate).toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    {t("assignments.maxLabel")}: {detail.maxMarks}{" "}
                    {t("assignments.marks")}
                  </span>
                </div>
              </div>

              {/* Submissions */}
              <div>
                <h4 className="text-md font-semibold mb-3 text-foreground">
                  {t("assignments.submissions")} (
                  {detail.submissions?.length || 0})
                </h4>
                {detail.submissions?.length === 0 ? (
                  <p className="text-muted-foreground dark:text-muted-foreground text-sm">
                    {t("assignments.noSubmissionsYet")}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("common.student")}</TableHead>
                        <TableHead>{t("assignments.submittedAt")}</TableHead>
                        <TableHead>{t("assignments.content")}</TableHead>
                        <TableHead>{t("common.grade")}</TableHead>
                        <TableHead>{t("assignments.feedback")}</TableHead>
                        <TableHead>{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.submissions?.map((sub, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {sub.student
                              ? typeof sub.student === "object"
                                ? sub.student.name
                                : sub.student
                              : t("assignments.unknown")}
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(sub.submittedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {sub.content || "—"}
                          </TableCell>
                          <TableCell>
                            {sub.grade !== undefined && sub.grade !== null ? (
                              <Badge variant="default">
                                {sub.grade}/{detail.maxMarks}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {t("assignments.ungraded")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">
                            {sub.feedback || "—"}
                          </TableCell>
                          <TableCell>
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openGradeDialog(sub)}
                              >
                                {t("common.grade")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("assignments.gradeSubmission")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {t("common.student")}:{" "}
              <strong className="text-foreground">
                {gradeForm.studentName}
              </strong>
            </p>
            <div>
              <Label>
                {t("assignments.gradeOutOf")} {detail?.maxMarks || 100})
              </Label>
              <Input
                type="number"
                min={0}
                max={detail?.maxMarks || 100}
                value={gradeForm.grade}
                onChange={(e) =>
                  setGradeForm({ ...gradeForm, grade: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>{t("assignments.feedback")}</Label>
              <Textarea
                value={gradeForm.feedback}
                onChange={(e) =>
                  setGradeForm({ ...gradeForm, feedback: e.target.value })
                }
                placeholder={t("assignments.feedbackPlaceholder")}
                rows={3}
              />
            </div>
            <Button
              onClick={submitGrade}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? t("common.saving") : t("assignments.submitGrade")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Submit Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("assignments.submitHomework")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t("assignments.yourAnswer")}</Label>
              <Textarea
                value={submitForm.content}
                onChange={(e) =>
                  setSubmitForm({ ...submitForm, content: e.target.value })
                }
                placeholder={t("assignments.answerPlaceholder")}
                rows={5}
              />
            </div>
            <div>
              <Label>{t("assignments.attachments")}</Label>
              <div className="mt-1 flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border hover:border-gray-400 transition-colors text-sm">
                  <Upload className="h-4 w-4" />
                  {uploading
                    ? t("assignments.uploading")
                    : t("assignments.uploadFile")}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
                  />
                </label>
              </div>
              {submitForm.attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {submitForm.attachments.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm bg-muted/50 rounded px-3 py-1.5"
                    >
                      <span className="truncate max-w-[250px]">
                        {t("assignments.attachment")} {idx + 1}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 h-6 px-2"
                        onClick={() =>
                          setSubmitForm((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter(
                              (_, i) => i !== idx,
                            ),
                          }))
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={submitAssignment}
              disabled={submitting || uploading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting
                ? t("assignments.submitting")
                : t("assignments.submitHomework")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
