import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./db";
import User from "./models/User";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const { email, password } = credentials;

        try {
          await connectDB();

          // Find user by email, include password + lockout fields
          const user = await User.findOne({
            email: email.toLowerCase(),
            isActive: true,
          }).select("+password +failedLoginAttempts +lockedUntil");

          if (!user) {
            throw new Error("Invalid email or password");
          }

          // Check account lockout
          if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            const minutesLeft = Math.ceil(
              (new Date(user.lockedUntil).getTime() - Date.now()) / 60000,
            );
            throw new Error(
              `Account locked. Try again in ${minutesLeft} minute(s)`,
            );
          }

          // Verify password with bcrypt
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            // Increment failed attempts
            const attempts = (user.failedLoginAttempts || 0) + 1;
            const updateFields: Record<string, unknown> = {
              failedLoginAttempts: attempts,
            };

            if (attempts >= MAX_LOGIN_ATTEMPTS) {
              updateFields.lockedUntil = new Date(
                Date.now() + LOCKOUT_DURATION_MS,
              );
            }

            await User.updateOne({ _id: user._id }, { $set: updateFields });

            if (attempts >= MAX_LOGIN_ATTEMPTS) {
              throw new Error(
                `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts. Try again in 15 minutes`,
              );
            }

            throw new Error(
              `Invalid email or password. ${MAX_LOGIN_ATTEMPTS - attempts} attempt(s) remaining`,
            );
          }

          // Successful login: reset lockout counters
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
              },
            },
          );

          // Get school info
          const schoolId = user.school ? user.school.toString() : "";

          return {
            id: user._id.toString(),
            school_id: schoolId,
            teacher_id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.school_id = user.school_id;
        token.teacher_id = user.teacher_id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Validate that school_id is a valid MongoDB ObjectId
        // Old sessions from Google Sheets era will have invalid IDs like "SCH001"
        const schoolId = token.school_id as string;
        if (schoolId && !mongoose.Types.ObjectId.isValid(schoolId)) {
          // Force re-authentication by returning empty session
          session.user.id = "";
          session.user.school_id = "";
          session.user.teacher_id = "";
          session.user.role = "";
          session.user.name = "";
          return session;
        }
        session.user.id = token.id as string;
        session.user.school_id = schoolId;
        session.user.teacher_id = token.teacher_id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Centralized auth helper. Returns a valid session or null.
 * Validates that school_id is a valid MongoDB ObjectId — rejects stale/old sessions.
 */
export async function getAuthSession() {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  // Reject sessions with empty or invalid school_id (legacy Google Sheets sessions)
  const sid = session.user.school_id;
  if (!sid || !mongoose.Types.ObjectId.isValid(sid)) return null;
  return session;
}

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      school_id: string;
      teacher_id: string;
      name: string;
      email: string;
      role: string;
    };
  }

  interface User {
    id: string;
    school_id: string;
    teacher_id: string;
    name: string;
    email: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    school_id: string;
    teacher_id: string;
    role: string;
    name: string;
  }
}
