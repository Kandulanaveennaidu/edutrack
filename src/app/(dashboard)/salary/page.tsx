"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Calculator } from "lucide-react";
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
import { showSuccess, showError } from "@/lib/alerts";
import { Spinner } from "@/components/ui/spinner";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocale } from "@/hooks/use-locale";

interface SalaryRecord {
  _id: string;
  teacherName: string;
  month: number;
  year: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  salaryPerDay: number;
  grossSalary: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  status: string;
}

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function SalaryPage() {
  useSession();
  const { t } = useLocale();

  const { canAdd, canEdit } = usePermissions("salary");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editRecord, setEditRecord] = useState<SalaryRecord | null>(null);
  const [editForm, setEditForm] = useState({
    deductions: 0,
    bonus: 0,
    status: "draft",
  });
  const [summary, setSummary] = useState({
    total_salary: 0,
    total_deductions: 0,
    total_bonus: 0,
    total_net: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      });
      const res = await fetch(`/api/salary?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data || []);
        setSummary(
          data.summary || {
            total_salary: 0,
            total_deductions: 0,
            total_bonus: 0,
            total_net: 0,
          },
        );
      }
    } catch {
      showError(t("salary.error"), t("salary.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateSalary = async () => {
    try {
      setGenerating(true);
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });

      if (res.ok) {
        const data = await res.json();
        showSuccess(
          t("salary.success"),
          data.message || t("salary.salaryGenerated"),
        );
        fetchData();
      } else {
        const err = await res.json();
        showError(t("salary.error"), err.error);
      }
    } catch {
      showError(t("salary.error"), t("salary.generateFailed"));
    } finally {
      setGenerating(false);
    }
  };

  const updateSalary = async () => {
    if (!editRecord) return;
    try {
      const res = await fetch("/api/salary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salary_id: editRecord._id,
          deductions: editForm.deductions,
          bonus: editForm.bonus,
          status: editForm.status,
        }),
      });

      if (res.ok) {
        showSuccess(t("salary.success"), t("salary.salaryUpdated"));
        setShowEdit(false);
        fetchData();
      } else {
        const err = await res.json();
        showError(t("salary.error"), err.error);
      }
    } catch {
      showError(t("salary.error"), t("salary.updateFailed"));
    }
  };

  const openEdit = (record: SalaryRecord) => {
    setEditRecord(record);
    setEditForm({
      deductions: record.deductions,
      bonus: record.bonus,
      status: record.status,
    });
    setShowEdit(true);
  };

  const statusColor = (s: string) => {
    if (s === "paid") return "present";
    if (s === "processed") return "late";
    return "secondary";
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("nav.salary")}
          </h1>
          <p className="text-muted-foreground">{t("salary.description")}</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canAdd && (
            <Button onClick={generateSalary} disabled={generating}>
              <Calculator className="mr-2 h-4 w-4" />
              {generating ? t("salary.generating") : t("salary.generateSalary")}
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: t("salary.grossSalary"),
            value: summary.total_salary,
            color: "text-orange-500 dark:text-orange-400",
          },
          {
            label: t("salary.deductions"),
            value: summary.total_deductions,
            color: "text-red-600",
          },
          {
            label: t("salary.bonus"),
            value: summary.total_bonus,
            color: "text-green-600",
          },
          {
            label: t("salary.netPayable"),
            value: summary.total_net,
            color: "text-amber-600",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>
                ₹{(s.value ?? 0).toLocaleString("en-IN")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("salary.salaryRecords")} - {months[month - 1]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("salary.teacher")}</TableHead>
                <TableHead>{t("salary.daysPA")}</TableHead>
                <TableHead>{t("salary.perDay")}</TableHead>
                <TableHead>{t("salary.gross")}</TableHead>
                <TableHead>{t("salary.deductions")}</TableHead>
                <TableHead>{t("salary.bonus")}</TableHead>
                <TableHead>{t("salary.netSalary")}</TableHead>
                <TableHead>{t("salary.status")}</TableHead>
                <TableHead>{t("salary.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground"
                  >
                    {t("salary.noRecords")}
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">
                      {r.teacherName}
                    </TableCell>
                    <TableCell>
                      {r.presentDays}/{r.absentDays}
                    </TableCell>
                    <TableCell>
                      ₹{(r.salaryPerDay ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      ₹{(r.grossSalary ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-red-600">
                      ₹{(r.deductions ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-green-600">
                      ₹{(r.bonus ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="font-bold">
                      ₹{(r.netSalary ?? 0).toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusColor(r.status) as
                            | "present"
                            | "late"
                            | "secondary"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {canEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(r)}
                        >
                          {t("salary.edit")}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("salary.editSalary")} - {editRecord?.teacherName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t("salary.deductionsLabel")}</Label>
              <Input
                type="number"
                value={editForm.deductions}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    deductions: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label>{t("salary.bonusLabel")}</Label>
              <Input
                type="number"
                value={editForm.bonus}
                onChange={(e) =>
                  setEditForm({ ...editForm, bonus: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>{t("salary.statusLabel")}</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t("salary.draft")}</SelectItem>
                  <SelectItem value="processed">
                    {t("salary.processed")}
                  </SelectItem>
                  <SelectItem value="paid">{t("salary.paid")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={updateSalary} className="w-full">
              {t("salary.saveChanges")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
