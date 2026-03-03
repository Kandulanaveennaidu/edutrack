"use client";

import { useState, useCallback, useEffect, Suspense, useRef } from "react";
import { signIn, useSession, SessionProvider } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Lock,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Fingerprint,
  Monitor,
  Globe,
  KeyRound,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { showSuccess, showError as showSwalError } from "@/lib/alerts";

// ── Auth Error Messages ──────────────────────────────────────────────────────
// Maps NextAuth error codes + custom codes → user-friendly messages
const AUTH_ERROR_MAP: Record<
  string,
  {
    title: string;
    message: string;
    icon: "warning" | "error" | "lock" | "info";
  }
> = {
  // NextAuth built-in error codes
  CredentialsSignin: {
    title: "Invalid Credentials",
    message:
      "The email or password you entered is incorrect. Please try again.",
    icon: "error",
  },
  SessionRequired: {
    title: "Session Expired",
    message: "Your session has expired. Please sign in again to continue.",
    icon: "warning",
  },
  Configuration: {
    title: "Configuration Error",
    message:
      "There was a server configuration issue. Please try again later or contact support.",
    icon: "error",
  },
  AccessDenied: {
    title: "Access Denied",
    message: "You do not have permission to access that resource.",
    icon: "lock",
  },
  Verification: {
    title: "Verification Required",
    message: "Please verify your email address before logging in.",
    icon: "info",
  },
  Default: {
    title: "Authentication Error",
    message:
      "An unexpected error occurred during authentication. Please try again.",
    icon: "error",
  },
  // Custom error codes from our authorize function
  InvalidCredentials: {
    title: "Invalid Credentials",
    message: "The email or password you entered is incorrect.",
    icon: "error",
  },
  AccountLocked: {
    title: "Account Locked",
    message:
      "Your account has been temporarily locked due to too many failed login attempts.",
    icon: "lock",
  },
  EmailNotVerified: {
    title: "Email Not Verified",
    message:
      "Please verify your email address before logging in. Check your inbox for the verification link.",
    icon: "info",
  },
  CredentialsRequired: {
    title: "Missing Credentials",
    message: "Both email and password are required to sign in.",
    icon: "warning",
  },
  DatabaseError: {
    title: "Service Unavailable",
    message:
      "We're experiencing technical difficulties. Please try again in a few moments.",
    icon: "error",
  },
  AccountDisabled: {
    title: "Account Disabled",
    message:
      "This account has been deactivated. Contact your administrator for assistance.",
    icon: "lock",
  },
  // Catch-all for undefined or unknown errors
  undefined: {
    title: "Authentication Error",
    message:
      "An unexpected error occurred. Please try again or contact support if the issue persists.",
    icon: "error",
  },
};

function getErrorInfo(errorCode: string | null) {
  if (!errorCode || errorCode === "null" || errorCode === "undefined") {
    return AUTH_ERROR_MAP["undefined"];
  }
  // Check for error codes with data (e.g., "InvalidCredentials:3" or "AccountLocked:15")
  const [code, data] = errorCode.split(":");
  const info = AUTH_ERROR_MAP[code] || AUTH_ERROR_MAP["Default"];

  // Customize message with contextual data
  if (code === "InvalidCredentials" && data) {
    return {
      ...info,
      message: `Invalid email or password. You have ${data} attempt(s) remaining before your account is locked.`,
    };
  }
  if (code === "AccountLocked" && data) {
    return {
      ...info,
      message: `Your account has been temporarily locked. Please try again in ${data} minute(s).`,
    };
  }
  return info;
}

// ── Device & Browser Detection ───────────────────────────────────────────────
function getDeviceInfo() {
  if (typeof window === "undefined")
    return { browser: "Unknown", os: "Unknown", device: "Unknown" };
  const ua = navigator.userAgent;
  let browser = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  let device = "Desktop";
  if (/Mobi|Android/i.test(ua)) device = "Mobile";
  else if (/Tablet|iPad/i.test(ua)) device = "Tablet";

  return { browser, os, device };
}

// ── Animated Background ──────────────────────────────────────────────────────
function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />

      {/* Floating geometric shapes */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 dark:bg-orange-500/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-orange-300/10 dark:bg-orange-400/5 rounded-full blur-2xl animate-float-reverse" />

      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}

// ── Security Badge ───────────────────────────────────────────────────────────
function SecurityBadge() {
  const [deviceInfo, setDeviceInfo] = useState({
    browser: "",
    os: "",
    device: "",
  });

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  if (!deviceInfo.browser) return null;

  return (
    <div className="mt-8 space-y-3">
      {/* Device info */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Monitor className="h-3 w-3" />
          {deviceInfo.browser}
        </span>
        <span className="flex items-center gap-1">
          <Globe className="h-3 w-3" />
          {deviceInfo.os}
        </span>
        <span className="flex items-center gap-1">
          <Fingerprint className="h-3 w-3" />
          {deviceInfo.device}
        </span>
      </div>

      {/* Security footer */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
        <Shield className="h-3 w-3" />
        <span>256-bit SSL · Brute-force protection · CSRF guard</span>
      </div>
    </div>
  );
}

// ── Error Alert Banner ───────────────────────────────────────────────────────
function ErrorBanner({
  errorCode,
  onDismiss,
}: {
  errorCode: string;
  onDismiss: () => void;
}) {
  const info = getErrorInfo(errorCode);
  const iconMap = {
    warning: (
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
    ),
    error: (
      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
    ),
    lock: (
      <Lock className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
    ),
    info: (
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
    ),
  };

  const bgMap = {
    warning:
      "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    error: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    lock: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
  };

  const textMap = {
    warning: "text-amber-800 dark:text-amber-300",
    error: "text-red-800 dark:text-red-300",
    lock: "text-red-800 dark:text-red-300",
    info: "text-blue-800 dark:text-blue-300",
  };

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl p-3.5 border animate-in fade-in slide-in-from-top-2 duration-300 ${bgMap[info.icon]}`}
    >
      {iconMap[info.icon]}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${textMap[info.icon]}`}>
          {info.title}
        </p>
        <p
          className={`text-xs mt-0.5 leading-relaxed ${textMap[info.icon]} opacity-80`}
        >
          {info.message}
        </p>
        {info.icon === "info" && errorCode?.startsWith("EmailNotVerified") && (
          <Link
            href="/verify-email"
            className="inline-flex items-center gap-1 text-xs mt-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Resend verification email <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
        aria-label="Dismiss"
      >
        <XCircle className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Login Timer (shows login duration) ───────────────────────────────────────
function LoginTimer({
  isLoading,
  startTime,
}: {
  isLoading: boolean;
  startTime: number | null;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading || !startTime) {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  if (!isLoading) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
      <Clock className="h-3 w-3 animate-spin" />
      <span>Authenticating... {(elapsed / 1000).toFixed(1)}s</span>
    </div>
  );
}

// ── Main Login Form (uses useSearchParams) ───────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [loginStartTime, setLoginStartTime] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginError, setLoginError] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Read error from URL params (set by NextAuth on server-side redirects)
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setUrlError(errorParam);
      // Clean up URL without triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [searchParams]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (sessionStatus === "authenticated" && session) {
      router.replace("/dashboard");
    }
  }, [sessionStatus, session, router]);

  // Auto-focus email field
  useEffect(() => {
    const timer = setTimeout(() => emailRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const updateField = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
      if (loginError) setLoginError("");
      if (urlError) setUrlError(null);
    },
    [errors, loginError, urlError],
  );

  const validate = () => {
    const e: Record<string, string> = {};
    const email = formData.email.trim();
    if (!email) {
      e.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      e.password = "Password is required";
    } else if (formData.password.length < 6) {
      e.password = "Password must be at least 6 characters";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setLoginError("");
    setUrlError(null);
    setLoginStartTime(Date.now());

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (result?.error) {
        const errCode = result.error;
        const info = getErrorInfo(errCode);
        setLoginError(errCode);
        showSwalError(info.title, info.message);
      } else if (result?.ok) {
        setLoginSuccess(true);
        showSuccess("Welcome Back!", "Redirecting to your dashboard...");
        // Small delay for the success animation
        await new Promise((r) => setTimeout(r, 600));
        const callbackUrl = searchParams.get("callbackUrl");
        router.push(callbackUrl ? decodeURI(callbackUrl) : "/dashboard");
        router.refresh();
      } else {
        // Unexpected: neither error nor ok
        setLoginError("Default");
        showSwalError(
          "Authentication Error",
          "An unexpected error occurred. Please try again.",
        );
      }
    } catch (error) {
      console.error("[Login] Unexpected error:", error);
      setLoginError("Default");
      showSwalError(
        "Login Error",
        "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
      setLoginStartTime(null);
    }
  };

  // Don't render form if already authenticated
  if (sessionStatus === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <AuthBackground />
      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <div className="mb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>
        </div>

        {/* Logo & Brand */}
        <div className="mb-7 text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-all duration-500 ${
              loginSuccess
                ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-200/60 dark:shadow-green-900/30 scale-110"
                : "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-200/60 dark:shadow-orange-900/30"
            }`}
          >
            {loginSuccess ? (
              <CheckCircle2 className="h-10 w-10 text-white animate-in zoom-in duration-300" />
            ) : (
              <GraduationCap className="h-10 w-10 text-white" />
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">CampusIQ</h1>
          <p className="mt-1 text-muted-foreground">
            Sign in to your institution dashboard
          </p>
        </div>

        {/* URL Error Banner (from NextAuth redirects) */}
        {urlError && (
          <div className="mb-4">
            <ErrorBanner
              errorCode={urlError}
              onDismiss={() => setUrlError(null)}
            />
          </div>
        )}

        <Card
          className={`shadow-xl border-0 ring-1 ring-border/60 dark:ring-slate-700/40 transition-all duration-500 ${
            loginSuccess ? "ring-green-300 dark:ring-green-800" : ""
          }`}
        >
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Sign In
            </CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} autoComplete="on">
            <CardContent className="space-y-4">
              {/* Inline Error Banner (from signIn callback) */}
              {loginError && (
                <ErrorBanner
                  errorCode={loginError}
                  onDismiss={() => setLoginError("")}
                />
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    ref={emailRef}
                    id="email"
                    type="email"
                    placeholder="you@institution.com"
                    className={`h-11 pr-4 pl-4 transition-all duration-200 ${
                      errors.email
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "focus:ring-primary/20 focus:border-primary"
                    }`}
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    autoComplete="email"
                    disabled={isLoading || loginSuccess}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="flex items-center gap-1.5"
                  >
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`h-11 pr-10 pl-4 transition-all duration-200 ${
                      errors.password
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "focus:ring-primary/20 focus:border-primary"
                    }`}
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    autoComplete="current-password"
                    disabled={isLoading || loginSuccess}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 cursor-pointer transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Security Info */}
              <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 p-3 border border-primary/10 dark:bg-primary/10 dark:border-primary/20">
                <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your account is secured with lockout protection. After 5
                  failed attempts, access will be temporarily restricted for 15
                  minutes.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex-col space-y-3 pt-2">
              <Button
                type="submit"
                className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
                  loginSuccess
                    ? "bg-green-500 hover:bg-green-600 shadow-green-200/50"
                    : ""
                }`}
                disabled={isLoading || loginSuccess}
              >
                {loginSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-5 w-5 animate-in zoom-in duration-300" />
                    Authenticated!
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>

              <LoginTimer isLoading={isLoading} startTime={loginStartTime} />
            </CardFooter>
          </form>
        </Card>

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
            >
              Register your institution
            </Link>
          </p>
        </div>

        {/* Security Badge */}
        <SecurityBadge />
      </div>
    </div>
  );
}

// ── Wrapper with Suspense + SessionProvider ──────────────────────────────────
function LoginPageContent() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

export default function LoginPage() {
  return (
    <SessionProvider>
      <LoginPageContent />
    </SessionProvider>
  );
}
