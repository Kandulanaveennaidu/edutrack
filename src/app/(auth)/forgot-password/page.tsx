"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  ArrowLeft,
  Mail,
  CheckCircle2,
  Shield,
  Send,
  Clock,
  AlertTriangle,
  Inbox,
  RefreshCw,
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
import { showSuccess, showError } from "@/lib/alerts";

// ── Animated Background ──────────────────────────────────────────────────────
function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50/50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 dark:bg-orange-500/5 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200/20 dark:bg-amber-500/5 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-orange-300/10 dark:bg-orange-400/5 rounded-full blur-2xl animate-float-reverse" />
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

// ── Countdown Timer ──────────────────────────────────────────────────────────
function ResendCountdown({
  seconds,
  onComplete,
}: {
  seconds: number;
  onComplete: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const timer = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(timer);
  }, [remaining, onComplete]);

  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      Resend available in {remaining}s
    </span>
  );
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => emailRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const validate = () => {
    if (!email.trim()) {
      setEmailError("Email address is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        setSent(true);
        setShowCountdown(true);
        setCanResend(false);
        showSuccess(
          "Email Sent",
          data.message || "Check your inbox for the reset link.",
        );
      } else {
        showError(
          "Error",
          data.error || "Something went wrong. Please try again.",
        );
      }
    } catch {
      showError("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setCanResend(false);
    setShowCountdown(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        showSuccess(
          "Email Resent",
          data.message || "A new reset link has been sent.",
        );
      } else {
        showError("Error", data.error || "Failed to resend email.");
        setCanResend(true);
        setShowCountdown(false);
      }
    } catch {
      showError("Error", "An unexpected error occurred.");
      setCanResend(true);
      setShowCountdown(false);
    } finally {
      setIsLoading(false);
    }
  };

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
              sent
                ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-200/60 dark:shadow-green-900/30 scale-110"
                : "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-200/60 dark:shadow-orange-900/30"
            }`}
          >
            {sent ? (
              <CheckCircle2 className="h-10 w-10 text-white animate-in zoom-in duration-300" />
            ) : (
              <GraduationCap className="h-10 w-10 text-white" />
            )}
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">CampusIQ</h1>
          <p className="mt-1 text-muted-foreground">
            {sent ? "Check your email" : "Reset your password"}
          </p>
        </div>

        {!sent ? (
          /* ── Request Form ────────────────────────────────────────────── */
          <Card className="shadow-xl border-0 ring-1 ring-border/60 dark:ring-slate-700/40">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Forgot Password
              </CardTitle>
              <CardDescription>
                Enter your registered email address and we&apos;ll send you a
                secure link to reset your password.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit} autoComplete="on">
              <CardContent className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    ref={emailRef}
                    id="email"
                    type="email"
                    placeholder="you@institution.com"
                    className={`h-11 transition-all duration-200 ${
                      emailError
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "focus:ring-primary/20 focus:border-primary"
                    }`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    autoComplete="email"
                    disabled={isLoading}
                  />
                  {emailError && (
                    <p className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                      <AlertTriangle className="h-3 w-3" />
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Security Notice */}
                <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 p-3 border border-primary/10 dark:bg-primary/10 dark:border-primary/20">
                  <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    For security, the reset link will expire in 1 hour. If you
                    don&apos;t receive an email, check your spam folder.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex-col space-y-3 pt-2">
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          /* ── Success State ───────────────────────────────────────────── */
          <Card className="shadow-xl border-0 ring-1 ring-green-200/60 dark:ring-green-700/40">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              {/* Animated email icon */}
              <div className="relative mb-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
                  <Inbox className="h-10 w-10 text-green-600 dark:text-green-400 animate-in zoom-in duration-500" />
                </div>
                <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 ring-4 ring-card">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-foreground mb-2">
                Reset Link Sent!
              </h2>
              <p className="text-sm text-muted-foreground mb-2 max-w-xs leading-relaxed">
                We&apos;ve sent a password reset link to:
              </p>
              <p className="text-sm font-medium text-foreground mb-4 bg-muted/50 px-4 py-2 rounded-lg">
                {email}
              </p>
              <p className="text-xs text-muted-foreground mb-6 max-w-xs leading-relaxed">
                The link will expire in 1 hour. Check your inbox and spam
                folder.
              </p>

              {/* Resend */}
              <div className="w-full space-y-3">
                {showCountdown && !canResend ? (
                  <div className="flex justify-center">
                    <ResendCountdown
                      seconds={60}
                      onComplete={() => {
                        setCanResend(true);
                        setShowCountdown(false);
                      }}
                    />
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Resend Reset Link
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Links */}
        <div className="mt-6 text-center space-y-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>
        </div>

        {/* Security Footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <Shield className="h-3 w-3" />
          <span>
            Protected by CampusIQ Security &middot; 256-bit SSL encryption
          </span>
        </div>
      </div>
    </div>
  );
}
