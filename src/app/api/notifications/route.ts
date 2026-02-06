import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/lib/models/Notification";
import { requireAuth, requireRole } from "@/lib/permissions";
import { notificationSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";

export async function GET() {
  try {
    const { error, session } = await requireAuth("notifications:read");
    if (error) return error;

    await connectDB();

    const notifications = await Notification.find({
      school: session!.user.school_id,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const filtered = notifications.filter(
      (n) => n.target_role === "all" || n.target_role === session!.user.role,
    );

    const userId = session!.user.teacher_id || session!.user.id;
    const unreadCount = filtered.filter((n) => {
      if (n.readBy && Array.isArray(n.readBy)) {
        return !n.readBy.some((id: unknown) => String(id) === userId);
      }
      return n.status === "unread";
    }).length;

    const data = filtered.map((n) => ({
      notification_id: n._id.toString(),
      school_id: n.school.toString(),
      type: n.type || "",
      title: n.title,
      message: n.message,
      target_role: n.target_role || "all",
      status: n.readBy?.some((id: unknown) => String(id) === userId)
        ? "read"
        : n.status || "unread",
      created_at: n.createdAt?.toISOString() || "",
    }));

    return NextResponse.json({
      success: true,
      data,
      unread_count: unreadCount,
    });
  } catch (error) {
    logError("GET", "/api/notifications", error);
    return NextResponse.json({ success: true, data: [], unread_count: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error, session } = await requireRole("admin");
    if (error) return error;

    const body = await request.json();
    const parsed = notificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { type, title, message, target_role } = parsed.data;

    await connectDB();

    await Notification.create({
      school: session!.user.school_id,
      type: type || "announcement",
      title,
      message,
      target_role: target_role || "all",
      status: "unread",
    });

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    logError("POST", "/api/notifications", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { error, session } = await requireAuth("notifications:read");
    if (error) return error;

    const body = await request.json();
    const { notification_id, action } = body;
    const userId = session!.user.teacher_id || session!.user.id;

    await connectDB();

    if (action === "mark_all_read") {
      await Notification.updateMany(
        { school: session!.user.school_id, status: "unread" },
        { $addToSet: { readBy: userId }, $set: { status: "read" } },
      );
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    }

    if (!notification_id) {
      return NextResponse.json(
        { error: "notification_id required" },
        { status: 400 },
      );
    }

    await Notification.findByIdAndUpdate(notification_id, {
      $addToSet: { readBy: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("PUT", "/api/notifications", error);
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 },
    );
  }
}
