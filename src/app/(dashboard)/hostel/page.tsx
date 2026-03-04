"use client";

import { useEffect, useState, useCallback } from "react";
import { BedDouble, Plus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { showSuccess, showError, confirmAlert } from "@/lib/alerts";
import { Spinner } from "@/components/ui/spinner";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocale } from "@/hooks/use-locale";

interface HostelInfo {
  _id: string;
  name: string;
  type: string;
  totalRooms: number;
  totalBeds: number;
}

interface HostelSummary {
  hostel_id: string;
  name: string;
  type: string;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: number;
}

interface Allocation {
  _id: string;
  hostelName: string;
  roomNumber: string;
  bedNumber: string;
  studentName: string;
  className: string;
  checkInDate: string;
  monthlyFee: number;
  status: string;
}

export default function HostelPage() {
  const { t } = useLocale();
  const { canAdd, canDelete } = usePermissions("hostel");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "allocations">("overview");
  const [hostels, setHostels] = useState<HostelInfo[]>([]);
  const [summaryData, setSummaryData] = useState<HostelSummary[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [showHostelDialog, setShowHostelDialog] = useState(false);
  const [showAllocDialog, setShowAllocDialog] = useState(false);
  const [hostelForm, setHostelForm] = useState({
    name: "",
    type: "boys",
    total_rooms: 20,
    total_beds: 80,
    warden_phone: "",
    facilities: [] as string[],
  });
  const [allocForm, setAllocForm] = useState({
    hostel_id: "",
    room_number: "",
    bed_number: "",
    student_id: "",
    check_in_date: "",
    monthly_fee: 0,
  });
  const [students, setStudents] = useState<
    Array<{ _id: string; name: string; class_name: string }>
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [hRes, sRes, aRes] = await Promise.all([
        fetch("/api/hostel?type=hostels"),
        fetch("/api/hostel?type=summary"),
        fetch("/api/hostel?type=allocations"),
      ]);

      if (hRes.ok) {
        const d = await hRes.json();
        setHostels(d.data || []);
      }
      if (sRes.ok) {
        const d = await sRes.json();
        setSummaryData(d.data || []);
      }
      if (aRes.ok) {
        const d = await aRes.json();
        setAllocations(d.data || []);
      }
    } catch {
      showError(t("common.error"), t("hostel.failedToFetch"));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch("/api/students");
      if (res.ok) {
        const d = await res.json();
        setStudents(d.data || []);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchStudents();
  }, [fetchData, fetchStudents]);

  const createHostel = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_hostel", ...hostelForm }),
      });
      if (res.ok) {
        showSuccess(t("common.success"), t("hostel.hostelCreated"));
        setShowHostelDialog(false);
        fetchData();
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("hostel.failedToCreate"));
    } finally {
      setSubmitting(false);
    }
  };

  const allocateStudent = async () => {
    try {
      setSubmitting(true);
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "allocate", ...allocForm }),
      });
      if (res.ok) {
        showSuccess(t("common.success"), t("hostel.studentAllocated"));
        setShowAllocDialog(false);
        fetchData();
      } else {
        const err = await res.json();
        showError(t("common.error"), err.error);
      }
    } catch {
      showError(t("common.error"), t("hostel.failedToAllocate"));
    } finally {
      setSubmitting(false);
    }
  };

  const vacateStudent = async (allocationId: string) => {
    const confirmed = await confirmAlert(
      t("hostel.vacateStudent"),
      t("hostel.vacateConfirm"),
      t("hostel.yesVacate"),
      "warning",
    );
    if (!confirmed) return;
    try {
      const res = await fetch("/api/hostel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vacate", allocation_id: allocationId }),
      });
      if (res.ok) {
        showSuccess(t("common.success"), t("hostel.studentVacated"));
        fetchData();
      }
    } catch {
      showError(t("common.error"), t("hostel.failedToVacate"));
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("nav.hostel")}
          </h1>
          <p className="text-muted-foreground">{t("hostel.description")}</p>
        </div>
        <div className="flex gap-2">
          {canAdd && (
            <Button onClick={() => setShowHostelDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("hostel.addHostel")}
            </Button>
          )}
          {canAdd && (
            <Button variant="outline" onClick={() => setShowAllocDialog(true)}>
              <BedDouble className="mr-2 h-4 w-4" />
              {t("hostel.allocateStudent")}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["overview", "allocations"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === tabKey ? "border-orange-500 text-orange-500 dark:text-orange-400" : "border-transparent text-muted-foreground"}`}
          >
            {tabKey === "overview"
              ? t("hostel.overview")
              : t("hostel.allocations")}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summaryData.map((h) => (
            <Card key={h.hostel_id}>
              <CardHeader className="pb-2">
                <CardTitle>{h.name}</CardTitle>
                <CardDescription>
                  {h.type === "boys"
                    ? t("hostel.typeBoys")
                    : h.type === "girls"
                      ? t("hostel.typeGirls")
                      : t("hostel.typeCoed")}{" "}
                  {t("hostel.hostelSuffix")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("hostel.totalBeds")}:
                    </span>
                    <span className="font-medium">{h.total_beds}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("hostel.occupied")}:
                    </span>
                    <span className="font-medium text-amber-600">
                      {h.occupied_beds}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("hostel.available")}:
                    </span>
                    <span className="font-medium text-green-600">
                      {h.available_beds}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${h.occupancy_rate}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    {h.occupancy_rate}% {t("hostel.occupancy")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
          {summaryData.length === 0 && (
            <p className="col-span-3 text-center text-muted-foreground py-8">
              {t("hostel.noHostels")}
            </p>
          )}
        </div>
      )}

      {tab === "allocations" && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("hostel.student")}</TableHead>
                  <TableHead>{t("hostel.class")}</TableHead>
                  <TableHead>{t("hostel.hostel")}</TableHead>
                  <TableHead>{t("hostel.room")}</TableHead>
                  <TableHead>{t("hostel.bed")}</TableHead>
                  <TableHead>{t("hostel.checkIn")}</TableHead>
                  <TableHead>{t("hostel.monthlyFee")}</TableHead>
                  <TableHead>{t("hostel.status")}</TableHead>
                  <TableHead>{t("hostel.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center text-muted-foreground"
                    >
                      {t("hostel.noAllocations")}
                    </TableCell>
                  </TableRow>
                ) : (
                  allocations.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">
                        {a.studentName}
                      </TableCell>
                      <TableCell>{a.className}</TableCell>
                      <TableCell>{a.hostelName}</TableCell>
                      <TableCell>{a.roomNumber}</TableCell>
                      <TableCell>{a.bedNumber}</TableCell>
                      <TableCell>
                        {a.checkInDate
                          ? new Date(a.checkInDate).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        ₹{(a.monthlyFee ?? 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "active" ? "present" : "secondary"
                          }
                        >
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.status === "active" && canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => vacateStudent(a._id)}
                          >
                            <UserMinus className="h-4 w-4" />
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
      )}

      {/* Add Hostel Dialog */}
      <Dialog open={showHostelDialog} onOpenChange={setShowHostelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hostel.addHostel")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label>{t("hostel.name")}</Label>
              <Input
                value={hostelForm.name}
                onChange={(e) =>
                  setHostelForm({ ...hostelForm, name: e.target.value })
                }
                placeholder={t("hostel.namePlaceholder")}
              />
            </div>
            <div>
              <Label>{t("hostel.type")}</Label>
              <Select
                value={hostelForm.type}
                onValueChange={(v) => setHostelForm({ ...hostelForm, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["boys", "girls", "co-ed"].map((typeOpt) => (
                    <SelectItem key={typeOpt} value={typeOpt}>
                      {typeOpt === "boys"
                        ? t("hostel.typeBoys")
                        : typeOpt === "girls"
                          ? t("hostel.typeGirls")
                          : t("hostel.typeCoed")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("hostel.totalRooms")}</Label>
                <Input
                  type="number"
                  value={hostelForm.total_rooms}
                  onChange={(e) =>
                    setHostelForm({
                      ...hostelForm,
                      total_rooms: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label>{t("hostel.totalBeds")}</Label>
                <Input
                  type="number"
                  value={hostelForm.total_beds}
                  onChange={(e) =>
                    setHostelForm({
                      ...hostelForm,
                      total_beds: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>{t("hostel.wardenPhone")}</Label>
              <Input
                value={hostelForm.warden_phone}
                onChange={(e) =>
                  setHostelForm({ ...hostelForm, warden_phone: e.target.value })
                }
              />
            </div>
            <Button
              onClick={createHostel}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? t("hostel.creating") : t("hostel.createHostel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Allocate Dialog */}
      <Dialog open={showAllocDialog} onOpenChange={setShowAllocDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("hostel.allocateStudent")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <Label>{t("hostel.hostel")}</Label>
              <Select
                value={allocForm.hostel_id || undefined}
                onValueChange={(v) =>
                  setAllocForm({ ...allocForm, hostel_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("hostel.selectHostel")} />
                </SelectTrigger>
                <SelectContent>
                  {hostels.map((h) => (
                    <SelectItem key={h._id} value={h._id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("hostel.student")}</Label>
              <Select
                value={allocForm.student_id || undefined}
                onValueChange={(v) =>
                  setAllocForm({ ...allocForm, student_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("hostel.selectStudent")} />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name} - {s.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t("hostel.roomNumber")}</Label>
                <Input
                  value={allocForm.room_number}
                  onChange={(e) =>
                    setAllocForm({ ...allocForm, room_number: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>{t("hostel.bedNumber")}</Label>
                <Input
                  value={allocForm.bed_number}
                  onChange={(e) =>
                    setAllocForm({ ...allocForm, bed_number: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>{t("hostel.checkInDate")}</Label>
              <Input
                type="date"
                value={allocForm.check_in_date}
                onChange={(e) =>
                  setAllocForm({ ...allocForm, check_in_date: e.target.value })
                }
              />
            </div>
            <div>
              <Label>{t("hostel.monthlyFeeLabel")}</Label>
              <Input
                type="number"
                value={allocForm.monthly_fee}
                onChange={(e) =>
                  setAllocForm({
                    ...allocForm,
                    monthly_fee: Number(e.target.value),
                  })
                }
              />
            </div>
            <Button
              onClick={allocateStudent}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? t("hostel.allocating") : t("hostel.allocate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
