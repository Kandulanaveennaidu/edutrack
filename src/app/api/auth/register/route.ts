import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { logError } from "@/lib/logger";
import { audit } from "@/lib/audit";
import { registerSchema } from "@/lib/validators";
import School from "@/lib/models/School";
import User from "@/lib/models/User";
import Token from "@/lib/models/Token";
import { sendEmail } from "@/lib/email/mailer";
import { welcomeEmail, verificationEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const { school_name, address, phone, email, admin_email, admin_password } =
      parsed.data;

    await connectDB();

    // Check duplicate
    const existingUser = await User.findOne({
      email: admin_email.toLowerCase(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    // Create school
    const school = await School.create({
      school_name,
      address,
      phone,
      email: email || admin_email,
      plan: "free",
      status: "active",
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(admin_password, 12);

    // Create admin user
    const adminUser = await User.create({
      name: school_name + " Admin",
      email: admin_email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
      school: school._id,
      phone: phone || "",
      emailVerified: false,
      isActive: true,
    });

    // Email verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    await Token.create({
      user: adminUser._id,
      token: verifyToken,
      type: "email_verification",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const schoolId = school._id.toString();
    const appUrl =
      process.env.APP_URL ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    // Send welcome email (non-blocking)
    sendEmail({
      to: admin_email,
      subject: "Welcome to EduTrack - School Registered!",
      html: welcomeEmail({
        name: school_name + " Admin",
        schoolName: school_name,
        schoolId,
        email: admin_email,
        role: "admin",
        loginUrl: `${appUrl}/login`,
      }),
    }).catch((e) => logError("POST", "/api/auth/register", e));

    // Send verification email (non-blocking)
    sendEmail({
      to: admin_email,
      subject: "Verify your EduTrack email",
      html: verificationEmail({
        name: school_name + " Admin",
        verifyUrl: `${appUrl}/api/auth/verify-email?token=${verifyToken}`,
        expiresIn: "24 hours",
      }),
    }).catch((e) => logError("POST", "/api/auth/register", e));

    await audit({
      schoolId: schoolId,
      action: "create",
      entity: "school",
      entityId: schoolId,
      userId: adminUser._id.toString(),
      userName: school_name + " Admin",
      userRole: "admin",
      metadata: { school_name, admin_email },
    });

    return NextResponse.json({
      success: true,
      school_id: schoolId,
      message: `School registered successfully! Your School ID is ${schoolId}`,
    });
  } catch (err) {
    logError("POST", "/api/auth/register", err);
    return NextResponse.json(
      { error: "Failed to register school" },
      { status: 500 },
    );
  }
}
