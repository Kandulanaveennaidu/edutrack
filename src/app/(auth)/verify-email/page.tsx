"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Mail,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Shield,
  Inbox,
  RefreshCw,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

// ── Resend Countdown ─────────────────────────────────────────────────────────
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

// ── Resend Email Form ────────────────────────────────────────────────────────
function ResendForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [showCountdown, setShowCountdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleResend = async () => {
    if (!email.trim()) {
      showError("Error", "Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showError("Error", "Please enter a valid email address");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setCanResend(false);
        setShowCountdown(true);
        showSuccess(
          "Success",
          data.message || "Verification email sent! Check your inbox.",
        );
      } else {
        showError("Error", data.error || "Failed to resend verification email");
      }
    } catch {
      showError("Error", "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3 w-full">
      <div className="space-y-2">
        <Label
          htmlFor="resend-email"
          className="flex items-center gap-1.5 text-sm"
        >
          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          Email Address
        </Label>
        <Input
          ref={inputRef}
          id="resend-email"
          type="email"
          placeholder="you@institution.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (sent) setSent(false);
          }}
          className="h-11 focus:ring-primary/20 focus:border-primary"
          disabled={sending}
        />
      </div>

      {showCountdown && !canResend ? (
        <div className="flex justify-center py-2">
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
          onClick={handleResend}
          disabled={sending}
          className="w-full h-11 font-semibold"
        >
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : sent ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Resend Verification Email
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Verification Email
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// ── Main Content ─────────────────────────────────────────────────────────────
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  // ── Success ────────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <Card className="shadow-xl border-0 ring-1 ring-green-200/60 dark:ring-green-700/40">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="relative mb-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400 animate-in zoom-in duration-500" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 ring-4 ring-card">
              <CheckCircle2 className="h-4 w-4 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Email Verified!
          </h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-xs leading-relaxed">
            Your email has been verified successfully. You can now sign in to
            your account.
          </p>
          <Button
            asChild
            size="lg"
            className="w-full max-w-xs h-12 font-semibold"
          >
            <Link href="/login">
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Expired ────────────────────────────────────────────────────────────────
  if (status === "expired") {
    return (
      <Card className="shadow-xl border-0 ring-1 ring-amber-200/60 dark:ring-amber-700/40">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 mb-6">
            <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Link Expired
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
            This verification link has expired. Enter your email below to
            receive a new verification link.
          </p>
          <ResendForm autoFocus />
        </CardContent>
      </Card>
    );
  }

  // ── Invalid / Error ────────────────────────────────────────────────────────
  if (status === "invalid" || status === "error") {
    return (
      <Card className="shadow-xl border-0 ring-1 ring-red-200/60 dark:ring-red-700/40">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 mb-6">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Verification Failed
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
            {status === "invalid"
              ? "The verification link is invalid. Please check the link and try again, or request a new one."
              : "Something went wrong during verification. Please try again or request a new verification email."}
          </p>
          <ResendForm autoFocus />
        </CardContent>
      </Card>
    );
  }

  // ── Default: Check Your Email ──────────────────────────────────────────────
  return (
    <Card className="shadow-xl border-0 ring-1 ring-border/60 dark:ring-slate-700/40">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center">
        {/* Animated email icon */}
        <div className="relative mb-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
            <Inbox className="h-10 w-10 text-primary animate-in zoom-in duration-500" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary ring-4 ring-card">
            <Mail className="h-3.5 w-3.5 text-white" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          Check Your Email
        </h2>
        <p className="text-sm text-muted-foreground mb-2 max-w-xs leading-relaxed">
          We&apos;ve sent a verification link to your email address. Click the
          link to verify your account.
        </p>
        <p className="text-xs text-muted-foreground/70 mb-6 max-w-xs">
          Didn&apos;t receive the email? Check your spam folder or request a new
          one below.
        </p>

        <ResendForm />

        {/* Tips */}
        <div className="mt-6 w-full max-w-xs">
          <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 p-3 border border-primary/10 dark:bg-primary/10 dark:border-primary/20">
            <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed text-left">
              Verification links expire in 24 hours. Make sure to check your
              spam/junk folder if you don&apos;t see the email.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page Wrapper ─────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-200/60 dark:shadow-orange-900/30">
            <Mail className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">CampusIQ</h1>
          <p className="mt-1 text-muted-foreground">Email Verification</p>
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>

        {/* Footer Links */}
        <div className="mt-6 text-center">
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
