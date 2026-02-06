import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { logError } from "@/lib/logger";
import { audit } from "@/lib/audit";
import Token from "@/lib/models/Token";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token || token.length < 20) {
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 },
      );
    }

    await connectDB();

    const tokenDoc = await Token.findOne({
      token,
      type: "email_verification",
    });

    if (!tokenDoc) {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 400 },
      );
    }

    // Check token expiry
    if (tokenDoc.expires_at && tokenDoc.expires_at < new Date()) {
      await Token.findByIdAndDelete(tokenDoc._id);
      return NextResponse.json(
        { error: "Verification link has expired. Please request a new one." },
        { status: 400 },
      );
    }

    // Mark user as verified
    await User.findByIdAndUpdate(tokenDoc.user, { emailVerified: true });

    // Delete the used token
    await Token.findByIdAndDelete(tokenDoc._id);

    await audit({
      schoolId: "system",
      action: "update",
      entity: "user",
      entityId: tokenDoc.user.toString(),
      userId: tokenDoc.user.toString(),
      userName: "",
      userRole: "unknown",
      changes: { emailVerified: { old: false, new: true } },
    });

    return NextResponse.json({
      message: "Email verified successfully! You can now log in.",
    });
  } catch (err) {
    logError("GET", "/api/auth/verify-email", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
