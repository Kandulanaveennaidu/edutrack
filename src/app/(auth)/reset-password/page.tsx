"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Shield,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Check,
  X,
  ShieldCheck,
  XCircle,
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
import { useLocale } from "@/hooks/use-locale";

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

// ── Password Strength Meter ──────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const { t } = useLocale();
  const checks = useMemo(
    () => [
      { label: t("password.atLeast6"), met: password.length >= 6 },
      { label: t("password.uppercase"), met: /[A-Z]/.test(password) },
      { label: t("password.lowercase"), met: /[a-z]/.test(password) },
      { label: t("password.number"), met: /[0-9]/.test(password) },
      { label: t("password.special"), met: /[^A-Za-z0-9]/.test(password) },
    ],
    [password, t],
  );

  const score = checks.filter((c) => c.met).length;
  const strengthLabel =
    score <= 1
      ? t("password.weak")
      : score <= 2
        ? t("password.fair")
        : score <= 3
          ? t("password.good")
          : score <= 4
            ? t("password.strong")
            : t("password.excellent");
  const strengthColor =
    score <= 1
      ? "bg-red-500"
      : score <= 2
        ? "bg-orange-500"
        : score <= 3
          ? "bg-yellow-500"
          : score <= 4
            ? "bg-emerald-500"
            : "bg-green-500";

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${strengthColor} transition-all duration-300 rounded-full`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {strengthLabel}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {checks.map((check) => (
          <div key={check.label} className="flex items-center gap-1.5 text-xs">
            {check.met ? (
              <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span
              className={
                check.met
                  ? "text-green-700 dark:text-green-400"
                  : "text-muted-foreground"
              }
            >
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reset Password Form ──────────────────────────────────────────────────────
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLocale();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!password) {
      e.password = t("auth.passwordRequired");
    } else if (password.length < 6) {
      e.password = t("resetPassword.atLeast6");
    } else if (!/[A-Z]/.test(password)) {
      e.password = t("resetPassword.needUppercase");
    } else if (!/[0-9]/.test(password)) {
      e.password = t("resetPassword.needNumber");
    }
    if (!confirmPassword) {
      e.confirmPassword = t("resetPassword.confirmRequired");
    } else if (password !== confirmPassword) {
      e.confirmPassword = t("resetPassword.passwordsNoMatch");
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        showSuccess(
          "Password Reset!",
          data.message || "Your password has been updated.",
        );
        setTimeout(() => router.push("/login"), 3000);
      } else {
        showError("Error", data.error || "Something went wrong");
      }
    } catch {
      showError("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Invalid/Missing Token ──────────────────────────────────────────────────
  if (!token) {
    return (
      <Card className="shadow-xl border-0 ring-1 ring-red-200/60 dark:ring-red-700/40">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40 mb-4">
            <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {t("resetPassword.invalidLink")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {t("resetPassword.invalidLinkMsg")}
          </p>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/login">{t("resetPassword.backToLogin")}</Link>
            </Button>
            <Button asChild>
              <Link href="/forgot-password">
                {t("resetPassword.requestNewLink")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <Card className="shadow-xl border-0 ring-1 ring-green-200/60 dark:ring-green-700/40">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40 mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400 animate-in zoom-in duration-300" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {t("resetPassword.updated")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            {t("resetPassword.updatedMsg")}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("resetPassword.redirecting")}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Reset Password Form ────────────────────────────────────────────────────
  return (
    <Card className="shadow-xl border-0 ring-1 ring-border/60 dark:ring-slate-700/40">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          {t("resetPassword.title")}
        </CardTitle>
        <CardDescription>{t("resetPassword.desc")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              {t("resetPassword.newPassword")}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t("resetPassword.createStrong")}
                className={`h-11 pr-10 transition-all duration-200 ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "focus:ring-primary/20 focus:border-primary"
                }`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: "" }));
                }}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 cursor-pointer transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              {t("resetPassword.confirmPassword")}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder={t("resetPassword.reEnter")}
                className={`h-11 pr-10 transition-all duration-200 ${
                  errors.confirmPassword
                    ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                    : "focus:ring-primary/20 focus:border-primary"
                }`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 cursor-pointer transition-colors"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex={-1}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                <AlertTriangle className="h-3 w-3" />
                {errors.confirmPassword}
              </p>
            )}
            {/* Password match indicator */}
            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                <Check className="h-3 w-3" />
                {t("resetPassword.passwordsMatch")}
              </p>
            )}
          </div>

          {/* Security Info */}
          <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 p-3 border border-primary/10 dark:bg-primary/10 dark:border-primary/20">
            <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("resetPassword.securityTip")}
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
                {t("resetPassword.resetting")}
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {t("resetPassword.title")}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// ── Page Wrapper ─────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const { t } = useLocale();
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
            {t("auth.backToHome")}
          </Link>
        </div>

        {/* Logo & Brand */}
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-200/60 dark:shadow-orange-900/30">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-foreground">CampusIQ</h1>
          <p className="mt-1 text-muted-foreground">
            {t("resetPassword.createNew")}
          </p>
        </div>

        <Suspense
          fallback={
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>

        {/* Footer Links */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("auth.backToSignIn")}
          </Link>
        </div>

        {/* Security Footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60">
          <Shield className="h-3 w-3" />
          <span>{t("auth.protectedBy")}</span>
        </div>
      </div>
    </div>
  );
}
