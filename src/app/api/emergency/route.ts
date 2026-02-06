import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EmergencyAlert from "@/lib/models/EmergencyAlert";
import Notification from "@/lib/models/Notification";
import { requireAuth, requireRole } from "@/lib/permissions";
import { emergencyAlertSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";
import { logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("emergency:read");
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    await connectDB();

    const query: Record<string, unknown> = { school: session!.user.school_id };
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const alerts = await EmergencyAlert.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const data = alerts.map((a) => ({
      alert_id: a._id.toString(),
      school_id: a.school.toString(),
      title: a.title,
      message: a.message,
      severity: a.severity,
      status: a.status,
      created_by: a.created_by?.toString() || "",
      created_by_name: a.created_by_name || "",
      resolved_by: a.resolved_by?.toString() || "",
      resolved_by_name: a.resolved_by_name || "",
      resolved_at: a.resolved_at?.toISOString() || "",
      instructions: a.instructions || "",
      affected_areas: a.affected_areas || "",
      created_at: a.createdAt?.toISOString() || "",
    }));

    const allAlerts = await EmergencyAlert.find({
      school: session!.user.school_id,
    }).lean();
    const stats = {
      total: allAlerts.length,
      active: allAlerts.filter((a) => a.status === "active").length,
      resolved: allAlerts.filter((a) => a.status === "resolved").length,
      critical: allAlerts.filter(
        (a) => a.severity === "critical" && a.status === "active",
      ).length,
    };

    return NextResponse.json({ data, stats });
  } catch (error) {
    logError("GET", "/api/emergency", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireRole("admin");
    if (error) return error;

    const body = await request.json();
    const parsed = emergencyAlertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { type, title, message, severity } = parsed.data;
    const { instructions, affected_areas } = body;

    await connectDB();

    const alert = await EmergencyAlert.create({
      school: session!.user.school_id,
      title,
      message,
      severity,
      status: "active",
      created_by: session!.user.id,
      created_by_name: session!.user.name || "",
      instructions: instructions || "",
      affected_areas: affected_areas || "",
    });

    await Notification.create({
      school: session!.user.school_id,
      type: "emergency",
      title: `🚨 Emergency: ${title}`,
      message: `[${severity.toUpperCase()}] ${message}`,
      target_role: "all",
      readBy: [],
    });

    await audit({
      action: "create",
      entity: "emergency_alert",
      entityId: alert._id.toString(),
      schoolId: session!.user.school_id,
      userId: session!.user.id || "",
      userName: session!.user.name,
      userRole: session!.user.role,
      metadata: { severity, type },
    });

    return NextResponse.json({
      message: "Emergency alert broadcast",
      data: { alert_id: alert._id.toString() },
    });
  } catch (error) {
    logError("POST", "/api/emergency", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, session } = await requireRole("admin");
    if (error) return error;

    const body = await request.json();
    const { alert_id, action } = body;

    if (!alert_id) {
      return NextResponse.json(
        { error: "alert_id is required" },
        { status: 400 },
      );
    }

    await connectDB();

    if (action === "resolve") {
      const result = await EmergencyAlert.findOneAndUpdate(
        { _id: alert_id, school: session!.user.school_id },
        {
          status: "resolved",
          resolved_by: session!.user.id,
          resolved_by_name: session!.user.name || "",
          resolved_at: new Date(),
        },
        { new: true },
      );

      if (!result) {
        return NextResponse.json({ error: "Alert not found" }, { status: 404 });
      }

      await Notification.create({
        school: session!.user.school_id,
        type: "general",
        title: `✅ Emergency Resolved: ${result.title}`,
        message: `The emergency "${result.title}" has been resolved by ${session!.user.name}`,
        target_role: "all",
        readBy: [],
      });

      await audit({
        action: "update",
        entity: "emergency_alert",
        entityId: alert_id,
        schoolId: session!.user.school_id,
        userId: session!.user.id || "",
        userName: session!.user.name,
        userRole: session!.user.role,
        metadata: { action: "resolved" },
      });

      return NextResponse.json({ message: "Alert resolved" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logError("PUT", "/api/emergency", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
