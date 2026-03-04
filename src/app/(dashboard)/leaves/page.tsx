"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { Check, X, Loader2, Plus, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError } from "@/lib/alerts";
import { Spinner } from "@/components/ui/spinner";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocale } from "@/hooks/use-locale";

interface LeaveRequest {
  leave_id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  roll_number: string;
  from_date: string;
  to_date: string;
  reason: string;
  status: string;
  applied_at: string;
  approved_by: string;
}

export default function LeavesPage() {
  const { data: session } = useSession();
  const { t } = useLocale();
  const { canAdd, canEdit } = usePermissions("leaves");
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    student_id: "",
    from_date: format(new Date(), "yyyy-MM-dd"),
    to_date: format(new Date(), "yyyy-MM-dd"),
    reason: "",
  });

  const fetchLeaves = useCallback(async () => {
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const response = await fetch(`/api/leaves${params}`);
      if (response.ok) {
        const result = await response.json();
        setLeaves(result.data || []);
      }
    } catch {
      console.error("Failed to fetch leaves");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showSuccess(t("leaves.success"), t("leaves.submitSuccess"));
        setShowDialog(false);
        setFormData({
          student_id: "",
          from_date: format(new Date(), "yyyy-MM-dd"),
          to_date: format(new Date(), "yyyy-MM-dd"),
          reason: "",
        });
        fetchLeaves();
      } else {
        const result = await response.json();
        throw new Error(result.error);
      }
    } catch {
      showError(t("leaves.error"), t("leaves.submitFailed"));
    }
  };

  const handleAction = async (
    leaveId: string,
    status: "approved" | "rejected",
  ) => {
    setProcessing(leaveId);
    try {
      const response = await fetch("/api/leaves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leave_id: leaveId, status }),
      });

      if (response.ok) {
        showSuccess(
          t("leaves.success"),
          status === "approved"
            ? t("leaves.requestApproved")
            : t("leaves.requestRejected"),
        );
        fetchLeaves();
      } else {
        throw new Error("Failed");
      }
    } catch {
      showError(
        t("leaves.error"),
        status === "approved"
          ? t("leaves.approveFailed")
          : t("leaves.rejectFailed"),
      );
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">{t("leaves.pending")}</Badge>;
      case "approved":
        return <Badge variant="present">{t("leaves.approved")}</Badge>;
      case "rejected":
        return <Badge variant="absent">{t("leaves.rejected")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const isAdmin = session?.user?.role === "admin" || canEdit;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("nav.leaves")}
          </h1>
          <p className="text-muted-foreground">{t("leaves.description")}</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("leaves.all")}</SelectItem>
              <SelectItem value="pending">{t("leaves.pending")}</SelectItem>
              <SelectItem value="approved">{t("leaves.approved")}</SelectItem>
              <SelectItem value="rejected">{t("leaves.rejected")}</SelectItem>
            </SelectContent>
          </Select>
          {canAdd && (
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("leaves.newRequest")}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("leaves.pending")}
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {leaves.filter((l) => l.status === "pending").length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("leaves.approved")}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {leaves.filter((l) => l.status === "approved").length}
                </p>
              </div>
              <Check className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("leaves.rejected")}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {leaves.filter((l) => l.status === "rejected").length}
                </p>
              </div>
              <X className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("leaves.leaveRequests")}</CardTitle>
          <CardDescription>
            {leaves.length} {t("leaves.requestsFound")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              {t("leaves.noRequests")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("leaves.student")}</TableHead>
                  <TableHead>{t("leaves.class")}</TableHead>
                  <TableHead>{t("leaves.from")}</TableHead>
                  <TableHead>{t("leaves.to")}</TableHead>
                  <TableHead>{t("leaves.reason")}</TableHead>
                  <TableHead>{t("leaves.status")}</TableHead>
                  {isAdmin && <TableHead>{t("leaves.actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => (
                  <TableRow key={leave.leave_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{leave.student_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {leave.student_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{leave.class_name}</TableCell>
                    <TableCell>{leave.from_date}</TableCell>
                    <TableCell>{leave.to_date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {leave.reason}
                    </TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        {leave.status === "pending" ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() =>
                                handleAction(leave.leave_id, "approved")
                              }
                              disabled={processing === leave.leave_id}
                            >
                              {processing === leave.leave_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleAction(leave.leave_id, "rejected")
                              }
                              disabled={processing === leave.leave_id}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {leave.approved_by || "-"}
                          </span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* New Leave Request Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("leaves.newLeaveRequest")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("leaves.studentId")}</Label>
              <Input
                placeholder={t("leaves.studentIdPlaceholder")}
                value={formData.student_id}
                onChange={(e) =>
                  setFormData({ ...formData, student_id: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("leaves.fromDate")}</Label>
                <Input
                  type="date"
                  value={formData.from_date}
                  onChange={(e) =>
                    setFormData({ ...formData, from_date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("leaves.toDate")}</Label>
                <Input
                  type="date"
                  value={formData.to_date}
                  onChange={(e) =>
                    setFormData({ ...formData, to_date: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("leaves.reason")}</Label>
              <Input
                placeholder={t("leaves.reasonPlaceholder")}
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {t("leaves.submitRequest")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
