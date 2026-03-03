import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./db";
import User from "./models/User";
import School from "./models/School";
import Role from "./models/Role";
import { audit } from "./audit";

export interface MenuPermissionData {
  menu: string;
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Standard error codes used by the auth system.
 * These are passed as ?error=CODE in the URL so the login page
 * can display human-readable messages.
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: "InvalidCredentials",
  ACCOUNT_LOCKED: "AccountLocked",
  EMAIL_NOT_VERIFIED: "EmailNotVerified",
  CREDENTIALS_REQUIRED: "CredentialsRequired",
  DATABASE_ERROR: "DatabaseError",
  SESSION_EXPIRED: "SessionExpired",
  ACCOUNT_DISABLED: "AccountDisabled",
  CONFIGURATION_ERROR: "Configuration",
} as const;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error(AUTH_ERROR_CODES.CREDENTIALS_REQUIRED);
        }

        const { email, password } = credentials;

        let db;
        try {
          db = await connectDB();
        } catch (dbErr) {
          console.error("[Auth] Database connection failed:", dbErr);
          throw new Error(AUTH_ERROR_CODES.DATABASE_ERROR);
        }

        try {
          // Find user by email, include password + lockout fields
          const user = await User.findOne({
            email: email.toLowerCase(),
          }).select(
            "+password +failedLoginAttempts +lockedUntil +isActive +emailVerified",
          );

          if (!user) {
            throw new Error(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
          }

          // Check if account is disabled
          if (!user.isActive) {
            throw new Error(AUTH_ERROR_CODES.ACCOUNT_DISABLED);
          }

          // Check account lockout
          if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
            const minutesLeft = Math.ceil(
              (new Date(user.lockedUntil).getTime() - Date.now()) / 60000,
            );
            throw new Error(
              `${AUTH_ERROR_CODES.ACCOUNT_LOCKED}:${minutesLeft}`,
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
              throw new Error(`${AUTH_ERROR_CODES.ACCOUNT_LOCKED}:15`);
            }

            const remaining = MAX_LOGIN_ATTEMPTS - attempts;
            throw new Error(
              `${AUTH_ERROR_CODES.INVALID_CREDENTIALS}:${remaining}`,
            );
          }

          // Check email verification
          if (!user.emailVerified) {
            throw new Error(AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED);
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

          // Audit log the successful login (fire-and-forget)
          audit({
            action: "login",
            entity: "user",
            entityId: user._id.toString(),
            schoolId: user.school ? user.school.toString() : "",
            userId: user._id.toString(),
            userName: user.name,
            userRole: user.role,
            metadata: { email: user.email },
          }).catch(() => {});

          // Get school info
          const schoolId = user.school ? user.school.toString() : "";

          // Load school for plan info
          let school = null;
          try {
            school = await School.findById(user.school);
          } catch {
            // School lookup failed — continue with defaults
          }
          let subscriptionStatus = school?.subscriptionStatus || "trial";

          // Check trial expiry
          if (
            subscriptionStatus === "trial" &&
            school?.trialEndsAt &&
            new Date(school.trialEndsAt) < new Date()
          ) {
            subscriptionStatus = "expired";
            await School.findByIdAndUpdate(user.school, {
              subscriptionStatus: "expired",
            }).catch(() => {});
          }

          return {
            id: user._id.toString(),
            school_id: schoolId,
            school_name: school?.school_name || "",
            name: user.name,
            email: user.email,
            role: user.role,
            plan: school?.plan || "starter",
            subscriptionStatus,
            allowedModules: user.allowedModules || [],
            customRole: user.customRole ? user.customRole.toString() : "",
            menuPermissions: [],
          };
        } catch (error: unknown) {
          // Ensure we always throw a proper Error with a message
          if (error instanceof Error && error.message) {
            throw error;
          }
          // Fallback: wrap unknown errors with a safe message
          console.error("[Auth] Unexpected authorize error:", error);
          throw new Error(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.school_id = user.school_id;
        token.school_name = user.school_name;
        token.role = user.role;
        token.name = user.name;
        token.plan = user.plan;
        token.subscriptionStatus = user.subscriptionStatus;
        token.allowedModules = user.allowedModules;
        token.customRole = user.customRole || "";
        token.menuPermissions = [];

        // Load menu permissions from custom role
        if (user.customRole) {
          try {
            await connectDB();
            const role = await Role.findById(user.customRole).lean();
            if (role && role.isActive) {
              token.menuPermissions = (role.permissions || []).map(
                (p: {
                  menu: string;
                  view: boolean;
                  add: boolean;
                  edit: boolean;
                  delete: boolean;
                }) => ({
                  menu: p.menu,
                  view: p.view,
                  add: p.add,
                  edit: p.edit,
                  delete: p.delete,
                }),
              );
            }
          } catch {
            // Role permissions load failed — continue with empty permissions
          }
        }
      }
      // Re-fetch plan on session update (e.g. after subscription change)
      if (trigger === "update" && token.school_id) {
        try {
          await connectDB();
          const school = await School.findById(token.school_id);
          if (school) {
            token.plan = school.plan;
            let subStatus = school.subscriptionStatus;
            if (
              subStatus === "trial" &&
              school.trialEndsAt &&
              new Date(school.trialEndsAt) < new Date()
            ) {
              subStatus = "expired";
              await School.findByIdAndUpdate(school._id, {
                subscriptionStatus: "expired",
              }).catch(() => {});
            }
            token.subscriptionStatus = subStatus;
          }
          const userDoc = await User.findById(token.id);
          if (userDoc) {
            token.allowedModules = userDoc.allowedModules || [];
            token.customRole = userDoc.customRole
              ? userDoc.customRole.toString()
              : "";

            // Reload menu permissions from custom role
            if (userDoc.customRole) {
              const role = await Role.findById(userDoc.customRole).lean();
              if (role && role.isActive) {
                token.menuPermissions = (role.permissions || []).map(
                  (p: {
                    menu: string;
                    view: boolean;
                    add: boolean;
                    edit: boolean;
                    delete: boolean;
                  }) => ({
                    menu: p.menu,
                    view: p.view,
                    add: p.add,
                    edit: p.edit,
                    delete: p.delete,
                  }),
                );
              } else {
                token.menuPermissions = [];
              }
            } else {
              token.menuPermissions = [];
            }
          }
        } catch {
          // Session update failed — continue with cached values
        }
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
          session.user.school_name = "";
          session.user.role = "";
          session.user.name = "";
          return session;
        }
        session.user.id = token.id as string;
        session.user.school_id = schoolId;
        session.user.school_name = (token.school_name as string) || "";
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.plan = (token.plan as string) || "starter";
        session.user.subscriptionStatus =
          (token.subscriptionStatus as string) || "trial";
        session.user.allowedModules = (token.allowedModules as string[]) || [];
        session.user.customRole = (token.customRole as string) || "";
        session.user.menuPermissions =
          (token.menuPermissions as MenuPermissionData[]) || [];
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Use NEXTAUTH_URL as canonical base to prevent 0.0.0.0 redirects
      const canonical = process.env.NEXTAUTH_URL || baseUrl;
      // Strip any trailing slash from canonical
      const base = canonical.replace(/\/$/, "");

      // Relative path → prepend canonical base
      if (url.startsWith("/")) return `${base}${url}`;
      // Already using the correct base
      if (url.startsWith(base)) return url;
      // Legacy: if url starts with the internal baseUrl (e.g. 0.0.0.0), rewrite to canonical
      if (url.startsWith(baseUrl)) {
        return url.replace(baseUrl, base);
      }
      return base;
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
  // Enable debug logging in development to catch auth issues
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, metadata) {
      console.error("[NextAuth Error]", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth Warning]", code);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        console.log("[NextAuth Debug]", code, metadata);
      }
    },
  },
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

// Re-export requireAuth from permissions for convenience
export {
  requireAuth,
  requireRole,
  hasPermission,
  getPermissions,
} from "./permissions";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      school_id: string;
      school_name: string;
      name: string;
      email: string;
      role: string;
      plan: string;
      subscriptionStatus: string;
      allowedModules: string[];
      customRole: string;
      menuPermissions: MenuPermissionData[];
    };
  }

  interface User {
    id: string;
    school_id: string;
    school_name: string;
    name: string;
    email: string;
    role: string;
    plan: string;
    subscriptionStatus: string;
    allowedModules: string[];
    customRole: string;
    menuPermissions: MenuPermissionData[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    school_id: string;
    school_name: string;
    role: string;
    name: string;
    plan: string;
    subscriptionStatus: string;
    allowedModules: string[];
    customRole: string;
    menuPermissions: MenuPermissionData[];
  }
}
