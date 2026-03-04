"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Monitor,
  Play,
  X,
  FileText,
  Users,
  PlayCircle,
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

interface OnlineExam {
  _id: string;
  title: string;
  description: string;
  subject: string;
  class_name: string;
  section: string;
  teacher: { _id: string; name: string; email: string } | null;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  questionCount: number;
  startTime: string;
  endTime: string;
  status: "draft" | "published" | "active" | "completed" | "cancelled";
  settings: {
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showResults?: boolean;
    allowRetake?: boolean;
    maxAttempts?: number;
  };
  createdAt: string;
}

interface Question {
  question: string;
  options: string[];
  correctOption: number;
  marks: number;
  explanation: string;
}

interface ExamDetail extends OnlineExam {
  questions: Question[];
  attempts: {
    student: {
      _id: string;
      name: string;
      rollNumber?: string;
      class_name?: string;
    } | null;
    answers: number[];
    score: number;
    totalMarks: number;
    startedAt: string;
    submittedAt: string;
    status: string;
  }[];
}

function getExamStatus(exam: OnlineExam) {
  const now = new Date();
  const start = new Date(exam.startTime);
  const end = new Date(exam.endTime);

  if (exam.status === "draft")
    return {
      label: "Draft",
      color: "bg-muted text-foreground dark:bg-card dark:text-foreground",
      icon: FileText,
    };
  if (exam.status === "cancelled")
    return {
      label: "Cancelled",
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: X,
    };
  if (exam.status === "completed" || now > end)
    return {
      label: "Completed",
      color:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      icon: CheckCircle,
    };
  if (now >= start && now <= end)
    return {
      label: "Live",
      color:
        "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      icon: Play,
    };
  return {
    label: "Upcoming",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
  };
}

export default function OnlineExamsPage() {
  const { t } = useLocale();
  const { data: sessionData } = useSession();
  const { canAdd, canEdit, canDelete } = usePermissions("exams");
  const isTeacherOrAdmin =
    sessionData?.user?.role === "admin" ||
    sessionData?.user?.role === "teacher";

  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<OnlineExam[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExamDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Form
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    class_name: "",
    section: "",
    duration: 60,
    totalMarks: 100,
    passingMarks: 40,
    startTime: "",
    endTime: "",
    status: "draft" as string,
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      showResults: true,
      allowRetake: false,
      maxAttempts: 1,
    },
  });

  // Questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showQuestionDialog, setShowQuestionDialog] = useState(false);
  const [editingQuestionIdx, setEditingQuestionIdx] = useState<number | null>(
    null,
  );
  const [questionForm, setQuestionForm] = useState<Question>({
    question: "",
    options: ["", "", "", ""],
    correctOption: 0,
    marks: 1,
    explanation: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterClass) params.set("class_name", filterClass);
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/api/online-exams?${params}`);
      if (res.ok) {
        const d = await res.json();
        setExams(d.data || []);
      }
    } catch {
      showError(t("common.error"), t("onlineExams.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [filterClass, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      subject: "",
      class_name: "",
      section: "",
      duration: 60,
      totalMarks: 100,
      passingMarks: 40,
      startTime: "",
      endTime: "",
      status: "draft",
      settings: {
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: true,
        allowRetake: false,
        maxAttempts: 1,
      },
    });
    setQuestions([]);
  };

  const openCreate = () => {
    setEditId(null);
    resetForm();
    setShowDialog(true);
  };

  const openEdit = async (exam: OnlineExam) => {
    setEditId(exam._id);
    setForm({
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      class_name: exam.class_name,
      section: exam.section || "",
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      startTime: exam.startTime
        ? new Date(exam.startTime).toISOString().slice(0, 16)
        : "",
      endTime: exam.endTime
        ? new Date(exam.endTime).toISOString().slice(0, 16)
        : "",
      status: exam.status,
      settings: exam.settings || {
        shuffleQuestions: false,
        shuffleOptions: false,
        showResults: true,
        allowRetake: false,
        maxAttempts: 1,
      },
    });
    // Fetch full exam with questions for editing
    try {
      const res = await fetch(`/api/online-exams/${exam._id}`);
      if (res.ok) {
        const d = await res.json();
        setQuestions(d.data?.questions || []);
      }
    } catch {
      /* silent */
    }
    setShowDialog(true);
  };

  const save = async () => {
    if (
      !form.title ||
      !form.subject ||
      !form.class_name ||
      !form.startTime ||
      !form.endTime
    ) {
      showError(
        t("onlineExams.validation"),
        t("onlineExams.requiredFieldsError"),
      );
      return;
    }
    try {
      setSubmitting(true);
      const method = editId ? "PUT" : "POST";
      const url = editId ? `/api/online-exams/${editId}` : "/api/online-exams";
      const payload = { ...form, questions };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showSuccess(
          t("common.success"),
          editId ? t("onlineExams.examUpdated") : t("onlineExams.examCreated"),
        );
        setShowDialog(false);
        setEditId(null);
        resetForm();
        fetchData();
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("onlineExams.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExam = async (id: string) => {
    const confirmed = await showConfirm(
      t("onlineExams.deleteTitle"),
      t("onlineExams.deleteConfirm"),
    );
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/online-exams/${id}`, { method: "DELETE" });
      if (res.ok) {
        showSuccess(t("onlineExams.deleted"), t("onlineExams.deleteSuccess"));
        fetchData();
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("onlineExams.deleteError"));
    }
  };

  const viewDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setShowDetailDialog(true);
      const res = await fetch(`/api/online-exams/${id}`);
      if (res.ok) {
        const d = await res.json();
        setDetail(d.data);
      } else {
        showError(t("common.error"), t("onlineExams.loadError"));
        setShowDetailDialog(false);
      }
    } catch {
      showError(t("common.error"), t("onlineExams.loadError"));
      setShowDetailDialog(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Question management
  const openAddQuestion = () => {
    setEditingQuestionIdx(null);
    setQuestionForm({
      question: "",
      options: ["", "", "", ""],
      correctOption: 0,
      marks: 1,
      explanation: "",
    });
    setShowQuestionDialog(true);
  };

  const openEditQuestion = (idx: number) => {
    setEditingQuestionIdx(idx);
    setQuestionForm({ ...questions[idx] });
    setShowQuestionDialog(true);
  };

  const saveQuestion = () => {
    if (!questionForm.question || questionForm.options.some((o) => !o.trim())) {
      showError(
        t("onlineExams.validation"),
        t("onlineExams.questionValidationError"),
      );
      return;
    }
    if (editingQuestionIdx !== null) {
      const updated = [...questions];
      updated[editingQuestionIdx] = questionForm;
      setQuestions(updated);
    } else {
      setQuestions([...questions, questionForm]);
    }
    setShowQuestionDialog(false);
    // Auto-update totalMarks
    const total = [
      ...questions,
      ...(editingQuestionIdx === null ? [questionForm] : []),
    ].reduce((s, q) => s + q.marks, 0);
    if (editingQuestionIdx !== null) {
      const updatedTotal = questions.reduce(
        (s, q, i) =>
          s + (i === editingQuestionIdx ? questionForm.marks : q.marks),
        0,
      );
      setForm((f) => ({ ...f, totalMarks: updatedTotal }));
    } else {
      setForm((f) => ({ ...f, totalMarks: total }));
    }
  };

  const removeQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setForm((f) => ({
      ...f,
      totalMarks: updated.reduce((s, q) => s + q.marks, 0),
    }));
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
            {t("nav.onlineExams")}
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground">
            {t("onlineExams.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={filterClass || undefined}
            onValueChange={(v) => setFilterClass(v === "__all__" ? "" : v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder={t("common.allClasses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("common.allClasses")}</SelectItem>
              {Array.from(new Set(exams.map((e) => e.class_name)))
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
              <SelectValue placeholder={t("common.allStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">{t("common.allStatus")}</SelectItem>
              <SelectItem value="draft">{t("common.draft")}</SelectItem>
              <SelectItem value="published">{t("common.published")}</SelectItem>
              <SelectItem value="active">{t("common.active")}</SelectItem>
              <SelectItem value="completed">
                {t("onlineExams.completed")}
              </SelectItem>
            </SelectContent>
          </Select>
          {canAdd && isTeacherOrAdmin && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("onlineExams.newExam")}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          {
            label: t("common.total"),
            count: exams.length,
            icon: Monitor,
            color: "text-orange-500 dark:text-orange-400",
          },
          {
            label: t("common.draft"),
            count: exams.filter((e) => e.status === "draft").length,
            icon: FileText,
            color: "text-muted-foreground",
          },
          {
            label: t("common.published"),
            count: exams.filter((e) => e.status === "published").length,
            icon: CheckCircle,
            color: "text-green-600",
          },
          {
            label: t("common.active"),
            count: exams.filter((e) => e.status === "active").length,
            icon: Play,
            color: "text-orange-500 dark:text-orange-400",
          },
          {
            label: t("onlineExams.completed"),
            count: exams.filter((e) => e.status === "completed").length,
            icon: CheckCircle,
            color: "text-emerald-600",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exams Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("onlineExams.title")}</TableHead>
                <TableHead>{t("onlineExams.subject")}</TableHead>
                <TableHead>{t("onlineExams.class")}</TableHead>
                <TableHead>{t("onlineExams.duration")}</TableHead>
                <TableHead>{t("onlineExams.questions")}</TableHead>
                <TableHead>{t("common.marks")}</TableHead>
                <TableHead>{t("onlineExams.schedule")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-10"
                  >
                    <Monitor className="mx-auto h-10 w-10 mb-2 text-slate-300 dark:text-muted-foreground" />
                    {t("onlineExams.noExamsFound")}
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => {
                  const status = getExamStatus(exam);
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={exam._id}>
                      <TableCell className="font-medium">
                        {exam.title}
                      </TableCell>
                      <TableCell>{exam.subject}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {exam.class_name}
                          {exam.section ? ` - ${exam.section}` : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {exam.duration} {t("onlineExams.min")}
                      </TableCell>
                      <TableCell>{exam.questionCount}</TableCell>
                      <TableCell>{exam.totalMarks}</TableCell>
                      <TableCell className="text-xs">
                        <div>
                          {exam.startTime
                            ? new Date(exam.startTime).toLocaleString()
                            : "—"}
                        </div>
                        <div className="text-muted-foreground">
                          {t("onlineExams.to")}{" "}
                          {exam.endTime
                            ? new Date(exam.endTime).toLocaleString()
                            : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {t(`onlineExams.status${status.label}`)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            title={t("common.view")}
                            onClick={() => viewDetail(exam._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!isTeacherOrAdmin &&
                            (status.label === "Live" ||
                              exam.status === "active" ||
                              exam.status === "published") && (
                              <Link href={`/online-exams/${exam._id}/take`}>
                                <Button
                                  size="sm"
                                  variant="default"
                                  title={t("onlineExams.takeExam")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  {t("onlineExams.takeExam")}
                                </Button>
                              </Link>
                            )}
                          {canEdit && isTeacherOrAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title={t("common.edit")}
                              onClick={() => openEdit(exam)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && isTeacherOrAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title={t("common.delete")}
                              onClick={() => deleteExam(exam._id)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? t("onlineExams.editExam") : t("onlineExams.createExam")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("onlineExams.titleLabel")} *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder={t("onlineExams.examTitlePlaceholder")}
                />
              </div>
              <div>
                <Label>{t("onlineExams.subject")} *</Label>
                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                  placeholder={t("onlineExams.subjectPlaceholder")}
                />
              </div>
            </div>
            <div>
              <Label>{t("common.description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder={t("onlineExams.examInstructionsPlaceholder")}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t("onlineExams.class")} *</Label>
                <Input
                  value={form.class_name}
                  onChange={(e) =>
                    setForm({ ...form, class_name: e.target.value })
                  }
                  placeholder={t("onlineExams.classPlaceholder")}
                />
              </div>
              <div>
                <Label>{t("onlineExams.section")}</Label>
                <Input
                  value={form.section}
                  onChange={(e) =>
                    setForm({ ...form, section: e.target.value })
                  }
                  placeholder={t("onlineExams.sectionPlaceholder")}
                />
              </div>
              <div>
                <Label>{t("onlineExams.durationMinutes")} *</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>{t("onlineExams.totalMarks")}</Label>
                <Input
                  type="number"
                  value={form.totalMarks}
                  onChange={(e) =>
                    setForm({ ...form, totalMarks: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>{t("onlineExams.passingMarks")}</Label>
                <Input
                  type="number"
                  value={form.passingMarks}
                  onChange={(e) =>
                    setForm({ ...form, passingMarks: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>{t("common.status")}</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("common.draft")}</SelectItem>
                    <SelectItem value="published">
                      {t("common.published")}
                    </SelectItem>
                    <SelectItem value="active">{t("common.active")}</SelectItem>
                    <SelectItem value="completed">
                      {t("onlineExams.completed")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("onlineExams.cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("onlineExams.startTime")} *</Label>
                <Input
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>{t("onlineExams.endTime")} *</Label>
                <Input
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Settings */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm text-foreground">
                {t("onlineExams.examSettings")}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    key: "shuffleQuestions",
                    label: t("onlineExams.shuffleQuestions"),
                  },
                  {
                    key: "shuffleOptions",
                    label: t("onlineExams.shuffleOptions"),
                  },
                  { key: "showResults", label: t("onlineExams.showResults") },
                  { key: "allowRetake", label: t("onlineExams.allowRetake") },
                ].map((s) => (
                  <label
                    key={s.key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        form.settings[
                          s.key as keyof typeof form.settings
                        ] as boolean
                      }
                      onChange={(e) =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            [s.key]: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-border"
                    />
                    <span className="text-sm">{s.label}</span>
                  </label>
                ))}
              </div>
              {form.settings.allowRetake && (
                <div className="w-48">
                  <Label>{t("onlineExams.maxAttempts")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.settings.maxAttempts || 1}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        settings: {
                          ...form.settings,
                          maxAttempts: Number(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-foreground">
                  {t("onlineExams.questions")} ({questions.length})
                </h4>
                <Button size="sm" variant="outline" onClick={openAddQuestion}>
                  <Plus className="h-3 w-3 mr-1" />
                  {t("onlineExams.addQuestion")}
                </Button>
              </div>
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                  {t("onlineExams.noQuestionsYet")}
                </p>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm"
                    >
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{q.question}</p>
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                          {q.options.length} {t("onlineExams.optionsCount")}{" "}
                          &middot; {q.marks} {t("common.marks")}
                          &middot; {t("onlineExams.correctOption")}:{" "}
                          {q.correctOption + 1}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditQuestion(idx)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeQuestion(idx)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={save} disabled={submitting} className="w-full">
              {submitting
                ? t("common.saving")
                : editId
                  ? t("onlineExams.updateExam")
                  : t("onlineExams.createExam")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onOpenChange={setShowQuestionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestionIdx !== null
                ? t("onlineExams.editQuestion")
                : t("onlineExams.addQuestionTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t("onlineExams.questionLabel")} *</Label>
              <Textarea
                value={questionForm.question}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, question: e.target.value })
                }
                placeholder={t("onlineExams.enterQuestion")}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("onlineExams.optionsLabel")} *</Label>
              {questionForm.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={questionForm.correctOption === idx}
                    onChange={() =>
                      setQuestionForm({ ...questionForm, correctOption: idx })
                    }
                    className="accent-primary"
                  />
                  <Input
                    value={opt}
                    onChange={(e) => {
                      const opts = [...questionForm.options];
                      opts[idx] = e.target.value;
                      setQuestionForm({ ...questionForm, options: opts });
                    }}
                    placeholder={`${t("onlineExams.optionN")} ${idx + 1}`}
                    className="flex-1"
                  />
                  {questionForm.options.length > 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const opts = questionForm.options.filter(
                          (_, i) => i !== idx,
                        );
                        let correct = questionForm.correctOption;
                        if (idx <= correct && correct > 0) correct--;
                        setQuestionForm({
                          ...questionForm,
                          options: opts,
                          correctOption: Math.min(correct, opts.length - 1),
                        });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
              {questionForm.options.length < 6 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setQuestionForm({
                      ...questionForm,
                      options: [...questionForm.options, ""],
                    })
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {t("onlineExams.addOption")}
                </Button>
              )}
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                {t("onlineExams.selectCorrectAnswer")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("common.marks")}</Label>
                <Input
                  type="number"
                  min={1}
                  value={questionForm.marks}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      marks: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>{t("onlineExams.explanationLabel")}</Label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    explanation: e.target.value,
                  })
                }
                placeholder={t("onlineExams.explanationPlaceholder")}
                rows={2}
              />
            </div>
            <Button onClick={saveQuestion} className="w-full">
              {editingQuestionIdx !== null
                ? t("onlineExams.updateQuestion")
                : t("onlineExams.addQuestionTitle")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail / Results Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("onlineExams.examDetails")}</DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : detail ? (
            <div className="space-y-6 py-4">
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
                    {t("onlineExams.duration")}: {detail.duration}{" "}
                    {t("onlineExams.min")}
                  </span>
                  <span className="text-muted-foreground">
                    {t("common.total")}: {detail.totalMarks} {t("common.marks")}
                  </span>
                  <span className="text-muted-foreground">
                    {t("onlineExams.pass")}: {detail.passingMarks}{" "}
                    {t("common.marks")}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                  <Clock className="inline h-3 w-3 mr-1" />
                  {detail.startTime
                    ? new Date(detail.startTime).toLocaleString()
                    : "—"}{" "}
                  —{" "}
                  {detail.endTime
                    ? new Date(detail.endTime).toLocaleString()
                    : "—"}
                </div>
              </div>

              {/* Questions */}
              {isTeacherOrAdmin &&
                detail.questions &&
                detail.questions.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-foreground">
                      {t("onlineExams.questions")} ({detail.questions.length})
                    </h4>
                    <div className="space-y-3">
                      {detail.questions.map((q, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm">
                            <span className="text-primary mr-1">
                              Q{idx + 1}.
                            </span>
                            {q.question}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {q.options.map((opt, oi) => (
                              <div
                                key={oi}
                                className={`text-xs px-2 py-1 rounded ${oi === q.correctOption ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 font-medium" : "bg-muted/50 text-muted-foreground dark:text-muted-foreground"}`}
                              >
                                {String.fromCharCode(65 + oi)}. {opt}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {q.marks}{" "}
                            {q.marks > 1
                              ? t("onlineExams.marksPlural")
                              : t("onlineExams.markSingular")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Attempts / Results */}
              {isTeacherOrAdmin &&
                detail.attempts &&
                detail.attempts.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold mb-3 text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("onlineExams.studentAttempts")} (
                      {detail.attempts.length})
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("common.student")}</TableHead>
                          <TableHead>{t("onlineExams.score")}</TableHead>
                          <TableHead>{t("onlineExams.result")}</TableHead>
                          <TableHead>{t("onlineExams.started")}</TableHead>
                          <TableHead>{t("onlineExams.submitted")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.attempts.map((a, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              {a.student
                                ? typeof a.student === "object"
                                  ? a.student.name
                                  : a.student
                                : t("onlineExams.unknown")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                {a.score}/{a.totalMarks}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  a.score >= detail.passingMarks
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {a.score >= detail.passingMarks
                                  ? t("onlineExams.pass")
                                  : t("onlineExams.fail")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {a.startedAt
                                ? new Date(a.startedAt).toLocaleString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {a.submittedAt
                                ? new Date(a.submittedAt).toLocaleString()
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
