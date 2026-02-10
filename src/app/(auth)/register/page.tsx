"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  X,
  Building2,
  Mail,
  Lock,
  Phone,
  MapPin,
  CheckCircle2,
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

const STEPS = [
  { id: 1, title: "School Info", icon: Building2 },
  { id: 2, title: "Admin Account", icon: Lock },
  { id: 3, title: "Review", icon: CheckCircle2 },
];

function PasswordStrength({ password }: { password: string }) {
  const checks = useMemo(
    () => [
      { label: "At least 6 characters", met: password.length >= 6 },
      { label: "Contains uppercase", met: /[A-Z]/.test(password) },
      { label: "Contains lowercase", met: /[a-z]/.test(password) },
      { label: "Contains number", met: /[0-9]/.test(password) },
      {
        label: "Contains special char",
        met: /[^A-Za-z0-9]/.test(password),
      },
    ],
    [password],
  );

  const score = checks.filter((c) => c.met).length;
  const strengthLabel =
    score <= 1
      ? "Weak"
      : score <= 2
        ? "Fair"
        : score <= 3
          ? "Good"
          : score <= 4
            ? "Strong"
            : "Excellent";
  const strengthColor =
    score <= 1
      ? "bg-red-500"
      : score <= 2
        ? "bg-orange-500"
        : score <= 3
          ? "bg-yellow-500"
          : score <= 4
            ? "bg-blue-500"
            : "bg-green-500";

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${strengthColor}`}
            style={{ width: `${(score / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {strengthLabel}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            {c.met ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <X className="h-3 w-3 text-slate-300" />
            )}
            <span className={c.met ? "text-green-600" : ""}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    school_name: "",
    address: "",
    phone: "",
    email: "",
    admin_email: "",
    admin_password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!formData.school_name.trim())
        e.school_name = "School name is required";
      else if (formData.school_name.trim().length < 2)
        e.school_name = "School name must be at least 2 characters";
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        e.email = "Please enter a valid email address (e.g., info@school.com)";
      if (formData.phone && !/^[\d\s+\-()]{10,15}$/.test(formData.phone))
        e.phone = "Enter a valid phone number (10-15 digits)";
    }
    if (s === 2) {
      if (!formData.admin_email.trim())
        e.admin_email = "Admin email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email.trim()))
        e.admin_email = "Please enter a valid email address";
      if (!formData.admin_password) e.admin_password = "Password is required";
      else if (formData.admin_password.length < 6)
        e.admin_password = "Password must be at least 6 characters";
      else if (!/[A-Z]/.test(formData.admin_password))
        e.admin_password =
          "Password must contain at least one uppercase letter";
      else if (!/[0-9]/.test(formData.admin_password))
        e.admin_password = "Password must contain at least one number";
      if (!formData.confirm_password)
        e.confirm_password = "Please confirm your password";
      else if (formData.admin_password !== formData.confirm_password)
        e.confirm_password = "Passwords do not match";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setStep(2);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: formData.school_name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          admin_email: formData.admin_email,
          admin_password: formData.admin_password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSchoolId(result.school_id);
        showSuccess(
          "Registration Successful!",
          "Your school has been registered.",
        );
      } else {
        showError(
          "Registration Failed",
          result.error || "Something went wrong",
        );
      }
    } catch {
      showError("Network Error", "Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success Screen ──
  if (schoolId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-200">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-foreground">
              Registration Complete!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your school has been successfully registered
            </p>
          </div>
          <Card className="shadow-xl border-0 ring-1 ring-slate-200/60">
            <CardContent className="p-6 space-y-4">
              <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-5 border border-green-200 text-center dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Your School ID
                </p>
                <p className="text-3xl font-bold text-green-800 mt-1 font-mono dark:text-green-300">
                  {schoolId}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-4 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                  Login Credentials
                </p>
                <div className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                  <div className="flex justify-between">
                    <span>Email:</span>
                    <span className="font-medium">{formData.admin_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Role:</span>
                    <span className="font-medium">Administrator</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-4 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  <strong>Important:</strong> Save your School ID! Share it with
                  teachers and staff so they can create their accounts.
                </p>
              </div>

              <Button
                className="w-full h-11"
                onClick={() => router.push("/login")}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Registration Form ──
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back to Home */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-200">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-3 text-2xl font-bold text-foreground">
            Register on EduTrack
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your school management system
          </p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  step >= s.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                }`}
              >
                <s.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{s.id}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`w-6 h-0.5 mx-1 ${step > s.id ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"}`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-xl border-0 ring-1 ring-slate-200/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {step === 1
                ? "School Information"
                : step === 2
                  ? "Admin Account"
                  : "Review & Register"}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? "Enter your school or college details"
                : step === 2
                  ? "Create the administrator account"
                  : "Verify your details before registering"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ── Step 1: School Info ── */}
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="school_name">
                    School / College Name{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="school_name"
                      placeholder="Enter school or college name"
                      className={`pl-10 ${errors.school_name ? "border-red-500" : ""}`}
                      value={formData.school_name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          school_name: e.target.value,
                        });
                        if (errors.school_name)
                          setErrors({ ...errors, school_name: "" });
                      }}
                    />
                  </div>
                  {errors.school_name && (
                    <p className="text-xs text-red-500">{errors.school_name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="phone"
                        placeholder="+91 9876543210"
                        className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">School Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="info@school.com"
                        className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="address"
                      placeholder="School address"
                      className="pl-10"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Admin Account ── */}
            {step === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="admin_email">
                    Admin Email <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="admin_email"
                      type="email"
                      placeholder="admin@school.com"
                      className={`pl-10 ${errors.admin_email ? "border-red-500" : ""}`}
                      value={formData.admin_email}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          admin_email: e.target.value,
                        });
                        if (errors.admin_email)
                          setErrors({ ...errors, admin_email: "" });
                      }}
                      autoComplete="email"
                    />
                  </div>
                  {errors.admin_email && (
                    <p className="text-xs text-red-500">{errors.admin_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="admin_password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a secure password"
                      className={`px-10 ${errors.admin_password ? "border-red-500" : ""}`}
                      value={formData.admin_password}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          admin_password: e.target.value,
                        });
                        if (errors.admin_password)
                          setErrors({ ...errors, admin_password: "" });
                      }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.admin_password && (
                    <p className="text-xs text-red-500">
                      {errors.admin_password}
                    </p>
                  )}
                  <PasswordStrength password={formData.admin_password} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="Confirm your password"
                      className={`pl-10 ${errors.confirm_password ? "border-red-500" : ""}`}
                      value={formData.confirm_password}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          confirm_password: e.target.value,
                        });
                        if (errors.confirm_password)
                          setErrors({ ...errors, confirm_password: "" });
                      }}
                      autoComplete="new-password"
                    />
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs text-red-500">
                      {errors.confirm_password}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <div className="space-y-3">
                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    School Details
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {formData.school_name}
                      </span>
                    </div>
                    {formData.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{formData.phone}</span>
                      </div>
                    )}
                    {formData.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{formData.email}</span>
                      </div>
                    )}
                    {formData.address && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Address:</span>
                        <span className="text-right max-w-[200px]">
                          {formData.address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Admin Account
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">
                        {formData.admin_email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Password:</span>
                      <span>{"•".repeat(formData.admin_password.length)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role:</span>
                      <span className="font-medium">Administrator</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    By registering, you agree to set up a school management
                    account. You can add teachers, students, and parents after
                    logging in.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between gap-3 pt-2">
            {step > 1 ? (
              <Button variant="outline" onClick={prevStep} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />
                Sign in instead
              </Link>
            )}
            {step < 3 ? (
              <Button onClick={nextStep} className="gap-1">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="gap-1 min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Register School
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
