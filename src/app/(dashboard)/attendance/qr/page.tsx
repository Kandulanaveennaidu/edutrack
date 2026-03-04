"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  QrCode,
  Timer,
  CheckCircle,
  AlertTriangle,
  Copy,
  Users,
  Loader2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { showSuccess, showError, showInfo } from "@/lib/alerts";
import { useClasses } from "@/hooks/use-classes";
import { useLocale } from "@/hooks/use-locale";

interface QRData {
  token: string;
  class_name: string;
  date: string;
  expires_at: string;
  qr_content?: string;
}

export default function QRAttendancePage() {
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [duration, setDuration] = useState("30");
  const [scanToken, setScanToken] = useState("");
  const [scanStudentId, setScanStudentId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    status?: string;
  } | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const { classes, classLabel } = useClasses();
  const { t } = useLocale();

  const isAdmin = session?.user?.role === "admin";

  // Countdown timer
  useEffect(() => {
    if (!qrData?.expires_at) return;
    const interval = setInterval(() => {
      const diff = new Date(qrData.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(t("qr.expired"));
        setQrData(null);
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}m ${secs}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [qrData]);

  const generateQR = useCallback(async () => {
    if (!selectedClass) {
      showError(t("common.error"), t("qr.pleaseSelectClass"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/qr-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          class_name: selectedClass,
          duration_minutes: parseInt(duration),
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setQrData(result.data);
        showSuccess(t("qr.qrGenerated"), `${duration} ${t("qr.minutes")}`);
      } else {
        throw new Error("Failed");
      }
    } catch {
      showError(t("common.error"), t("qr.failedToGenerate"));
    } finally {
      setLoading(false);
    }
  }, [selectedClass, duration]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/qr-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scan",
          token: scanToken,
          student_id: scanStudentId,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setScanResult({
          success: true,
          message: result.message,
          status: result.data?.status,
        });
      } else {
        setScanResult({ success: false, message: result.error });
      }
    } catch {
      setScanResult({ success: false, message: t("qr.failedToScan") });
    } finally {
      setScanning(false);
    }
  };

  const copyToken = () => {
    if (qrData?.token) {
      navigator.clipboard.writeText(qrData.token);
      showInfo(t("qr.copied").split(" ")[0], t("qr.copied"));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("qr.title")}</h1>
        <p className="text-muted-foreground">{t("qr.desc")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Generate QR - Teacher/Admin */}
        {(isAdmin || session?.user?.role === "teacher") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                {t("qr.generateCode")}
              </CardTitle>
              <CardDescription>{t("qr.createToken")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>
                  {t("common.select")} {classLabel}
                </Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={`Choose a ${classLabel.toLowerCase()}...`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    {classes.length === 0 && (
                      <SelectItem value="__none" disabled>
                        {t("qr.noClassesFound")}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("qr.duration")}</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 {t("qr.minutes")}</SelectItem>
                    <SelectItem value="15">15 {t("qr.minutes")}</SelectItem>
                    <SelectItem value="30">30 {t("qr.minutes")}</SelectItem>
                    <SelectItem value="45">45 {t("qr.minutes")}</SelectItem>
                    <SelectItem value="60">60 {t("qr.minutes")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full"
                onClick={generateQR}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="mr-2 h-4 w-4" />
                )}
                {t("qr.generateToken")}
              </Button>

              {qrData && (
                <div className="rounded-lg border bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="default" className="text-xs">
                      {t("qr.active")}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-amber-600">
                      <Timer className="h-4 w-4" />
                      {timeLeft}
                    </div>
                  </div>

                  {/* QR Visual Representation */}
                  <div className="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-lg border-4 border-dashed border-orange-300 bg-card">
                    <div className="text-center">
                      <QrCode className="mx-auto h-16 w-16 text-orange-500 dark:text-orange-400" />
                      <p className="mt-2 text-xs text-muted-foreground">
                        {qrData.class_name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={qrData.token}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button variant="outline" size="icon" onClick={copyToken}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("qr.shareToken")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Scan / Enter Token - Student Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              {t("qr.markViaToken")}
            </CardTitle>
            <CardDescription>{t("qr.enterToken")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScan} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("qr.studentId")}</Label>
                <Input
                  placeholder={t("qr.studentIdPlaceholder")}
                  value={scanStudentId}
                  onChange={(e) => setScanStudentId(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("qr.qrToken")}</Label>
                <Input
                  placeholder={t("qr.pasteToken")}
                  value={scanToken}
                  onChange={(e) => setScanToken(e.target.value)}
                  className="font-mono"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="outline"
                disabled={scanning}
              >
                {scanning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {t("qr.markAttendance")}
              </Button>

              {scanResult && (
                <div
                  className={`rounded-lg p-4 ${
                    scanResult.success
                      ? "bg-green-50 text-green-800"
                      : "bg-red-50 text-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {scanResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">{scanResult.message}</p>
                      {scanResult.status && (
                        <p className="text-sm">
                          {t("qr.status")}:{" "}
                          <Badge
                            variant={
                              scanResult.status === "present"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {scanResult.status}
                          </Badge>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>{t("qr.howItWorks")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-orange-50 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <span className="text-lg font-bold text-orange-500 dark:text-orange-400">
                  1
                </span>
              </div>
              <h3 className="font-medium">{t("qr.teacherGenerates")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("qr.teacherGeneratesDesc")}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <span className="text-lg font-bold text-green-600">2</span>
              </div>
              <h3 className="font-medium">{t("qr.studentsScan")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("qr.studentsScanDesc")}
              </p>
            </div>
            <div className="rounded-lg bg-amber-50 p-4 text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <span className="text-lg font-bold text-amber-600">3</span>
              </div>
              <h3 className="font-medium">{t("qr.autoRecorded")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("qr.autoRecordedDesc")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
