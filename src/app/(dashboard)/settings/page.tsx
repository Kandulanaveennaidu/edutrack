"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Save, Loader2, School, Bell, Clock, Calendar } from "lucide-react";
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
import { showSuccess, showError } from "@/lib/alerts";
import { Spinner } from "@/components/ui/spinner";
import { usePermissions } from "@/hooks/use-permissions";
import { useLocale } from "@/hooks/use-locale";

interface SchoolInfo {
  school_id: string;
  school_name: string;
  address: string;
  phone: string;
  email: string;
  admin_email: string;
  plan: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { canEdit } = usePermissions("settings");
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({
    attendance_time_start: "09:00",
    attendance_time_end: "10:00",
    late_threshold_minutes: "15",
    working_days: "Mon,Tue,Wed,Thu,Fri,Sat",
    notification_enabled: "true",
    low_attendance_threshold: "75",
    academic_year: "2025-2026",
    sms_notifications: "false",
    email_notifications: "true",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const result = await response.json();
          if (result.school) setSchool(result.school);
          if (result.settings) {
            setSettings((prev) => ({ ...prev, ...result.settings }));
          }
        }
      } catch {
        console.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        showSuccess(
          t("settings.settingsSaved"),
          t("settings.settingsSavedDesc"),
        );
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      showError("Error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("nav.settings")}</h1>
          <p className="text-muted-foreground">
            {t("settings.description")}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("settings.saveSettings")}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Institution Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <School className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            <CardTitle>{t("settings.institutionInfo")}</CardTitle>
          </div>
          <CardDescription>
            {t("settings.contactSupport")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("settings.institutionId")}</Label>
              <Input value={school?.school_id || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.institutionName")}</Label>
              <Input value={school?.school_name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.adminEmail")}</Label>
              <Input value={school?.admin_email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.phone")}</Label>
              <Input value={school?.phone || ""} disabled />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t("settings.address")}</Label>
              <Input value={school?.address || ""} disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("settings.contactSupport")}
          </p>
        </CardContent>
      </Card>

      {/* Attendance Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            <CardTitle>{t("settings.attendanceSettings")}</CardTitle>
          </div>
          <CardDescription>
            {t("settings.configureAttendance")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("settings.attendanceStartTime")}</Label>
              <Input
                type="time"
                value={settings.attendance_time_start}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attendance_time_start: e.target.value,
                  })
                }
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.attendanceEndTime")}</Label>
              <Input
                type="time"
                value={settings.attendance_time_end}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    attendance_time_end: e.target.value,
                  })
                }
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.lateThreshold")}</Label>
              <Input
                type="number"
                value={settings.late_threshold_minutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    late_threshold_minutes: e.target.value,
                  })
                }
                disabled={!isAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("settings.lowAttendanceAlert")}</Label>
              <Input
                type="number"
                value={settings.low_attendance_threshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    low_attendance_threshold: e.target.value,
                  })
                }
                disabled={!isAdmin}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            <CardTitle>{t("settings.academicSettings")}</CardTitle>
          </div>
          <CardDescription>
            {t("settings.configureAcademic")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("settings.academicYear")}</Label>
              <Select
                value={settings.academic_year}
                onValueChange={(v) =>
                  setSettings({ ...settings, academic_year: v })
                }
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2026-2027">2026-2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("settings.workingDays")}</Label>
              <Input
                value={settings.working_days}
                onChange={(e) =>
                  setSettings({ ...settings, working_days: e.target.value })
                }
                placeholder="Mon,Tue,Wed,Thu,Fri,Sat"
                disabled={!isAdmin}
              />
              <p className="text-xs text-muted-foreground">
                Comma separated: Mon,Tue,Wed,Thu,Fri,Sat
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            <CardTitle>{t("settings.notificationSettings")}</CardTitle>
          </div>
          <CardDescription>
            {t("settings.configureNotifications")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("settings.inAppNotifications")}</Label>
              <Select
                value={settings.notification_enabled}
                onValueChange={(v) =>
                  setSettings({ ...settings, notification_enabled: v })
                }
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("settings.enabled")}</SelectItem>
                  <SelectItem value="false">{t("settings.disabled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("settings.emailNotifications")}</Label>
              <Select
                value={settings.email_notifications}
                onValueChange={(v) =>
                  setSettings({ ...settings, email_notifications: v })
                }
                disabled={!isAdmin}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("settings.enabled")}</SelectItem>
                  <SelectItem value="false">{t("settings.disabled")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
