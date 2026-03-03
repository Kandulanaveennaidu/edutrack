"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SessionProvider, useSession } from "next-auth/react";
import Link from "next/link";
import {
  GraduationCap,
  CreditCard,
  Lock,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Building2,
  User,
  MapPin,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { showSuccess, showError } from "@/lib/alerts";
import { PLANS, type PlanId, type BillingCycle } from "@/lib/plans";

// ─── USD Prices ──────────────────────────────────────────────────────────────
const PLAN_PRICES_USD: Record<string, number> = {
  starter: 0,
  basic: 11.99,
  pro: 23.99,
  enterprise: 47.99,
};

// ─── Country options ─────────────────────────────────────────────────────────
const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "IN", label: "India" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "SG", label: "Singapore" },
  { value: "JP", label: "Japan" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "ZA", label: "South Africa" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "PH", label: "Philippines" },
  { value: "MY", label: "Malaysia" },
  { value: "ID", label: "Indonesia" },
  { value: "NZ", label: "New Zealand" },
  { value: "SA", label: "Saudi Arabia" },
];

// ─── Card formatting helpers ─────────────────────────────────────────────────
function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").substring(0, 16);
  const groups = digits.match(/.{1,4}/g);
  return groups ? groups.join(" ") : digits;
}

function getCardBrand(number: string): string {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "Visa";
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
  if (/^3[47]/.test(clean)) return "Amex";
  if (/^6(?:011|5)/.test(clean)) return "Discover";
  return "";
}

// ─── Validation ──────────────────────────────────────────────────────────────
interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  cardNumber?: string;
  expMonth?: string;
  expYear?: string;
  cvv?: string;
}

function validateForm(
  billing: typeof initialBilling,
  card: typeof initialCard,
): FormErrors {
  const errors: FormErrors = {};
  if (!billing.firstName.trim()) errors.firstName = "First name is required";
  if (!billing.lastName.trim()) errors.lastName = "Last name is required";
  if (!billing.email.trim() || !/\S+@\S+\.\S+/.test(billing.email))
    errors.email = "Valid email is required";
  if (!billing.address.trim()) errors.address = "Street address is required";
  if (!billing.city.trim()) errors.city = "City is required";
  if (!billing.state) errors.state = "State is required";
  if (
    !billing.zip.trim() ||
    !/^[a-zA-Z0-9\s\-]{3,10}$/.test(billing.zip.trim())
  )
    errors.zip = "Valid ZIP / postal code is required";

  const cardDigits = card.number.replace(/\D/g, "");
  if (!cardDigits || cardDigits.length < 13 || cardDigits.length > 16)
    errors.cardNumber = "Valid card number is required";
  if (!card.expMonth) errors.expMonth = "Required";
  if (!card.expYear) errors.expYear = "Required";
  if (!card.cvv || card.cvv.length < 3) errors.cvv = "Valid CVV is required";

  return errors;
}

const initialBilling = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
};

const initialCard = {
  number: "",
  expMonth: "",
  expYear: "",
  cvv: "",
};

// ─── Checkout Inner Component ────────────────────────────────────────────────
function CheckoutInner() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const planId = (searchParams.get("plan") || "basic") as PlanId;
  const billingCycleParam = (searchParams.get("cycle") ||
    "monthly") as BillingCycle;
  const source = searchParams.get("source") || "plans"; // plans or billing

  const [billingCycle, setBillingCycle] =
    useState<BillingCycle>(billingCycleParam);
  const [billing, setBilling] = useState({ ...initialBilling });
  const [card, setCard] = useState({ ...initialCard });
  const [errors, setErrors] = useState<FormErrors>({});
  const [processing, setProcessing] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  // ── Helpers: functional setState + real-time error clearing ──────────────
  const updateBilling = (field: string, value: string) => {
    setBilling((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const updateCard = (field: string, value: string) => {
    setCard((prev) => ({ ...prev, [field]: value }));
    const errorKey = field === "number" ? "cardNumber" : field;
    if (errors[errorKey as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const planConfig = PLANS.find((p) => p.id === planId);
  const monthlyPrice = PLAN_PRICES_USD[planId] || 0;
  const totalPrice =
    billingCycle === "monthly" ? monthlyPrice : monthlyPrice * 10;
  const cardBrand = getCardBrand(card.number);

  // Pre-fill email from session
  useEffect(() => {
    if (session?.user?.email && !billing.email) {
      setBilling((prev) => ({
        ...prev,
        email: session.user?.email || prev.email,
      }));
    }
    if (session?.user?.name && !billing.firstName) {
      const parts = (session.user.name || "").split(" ");
      setBilling((prev) => ({
        ...prev,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Current exp month/year defaults
  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 12 }, (_, i) => currentYear + i),
    [currentYear],
  );

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  if (!planConfig || planId === "starter" || monthlyPrice <= 0) {
    router.push("/plans");
    return null;
  }

  const handleFieldBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(billing, card);
    setErrors(validationErrors);

    // Mark all fields as touched
    setTouched(
      new Set([
        "firstName",
        "lastName",
        "email",
        "phone",
        "address",
        "city",
        "state",
        "zip",
        "cardNumber",
        "expMonth",
        "expYear",
        "cvv",
      ]),
    );

    if (Object.keys(validationErrors).length > 0) {
      const errorFields = Object.values(validationErrors).filter(Boolean);
      showError(
        "Validation Error",
        `Please fix the following: ${errorFields.join(", ")}`,
      );
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/payment/authorize-net", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: card.number.replace(/\s/g, ""),
          expMonth: card.expMonth,
          expYear: card.expYear,
          cvv: card.cvv,
          plan: planId,
          billingCycle,
          type: "subscription",
          billingAddress: {
            firstName: billing.firstName.trim(),
            lastName: billing.lastName.trim(),
            email: billing.email.trim(),
            phone: billing.phone.trim(),
            company: billing.company.trim(),
            address: billing.address.trim(),
            city: billing.city.trim(),
            state: billing.state,
            zip: billing.zip.trim(),
            country: billing.country,
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Payment failed");

      showSuccess(
        "Payment Successful!",
        `You are now subscribed to the ${planConfig.name} plan. A receipt has been sent to ${billing.email}.`,
      );

      await update();

      // Redirect based on source
      setTimeout(() => {
        if (source === "billing") {
          router.push("/billing");
        } else {
          router.push("/dashboard");
        }
      }, 1800);
    } catch (err) {
      showError(
        "Payment Failed",
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setProcessing(false);
    }
  };

  const showFieldError = (field: keyof FormErrors) =>
    touched.has(field) && errors[field];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-orange-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-orange-500 dark:text-orange-400" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                CampusIQ
              </span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Back link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-6 text-muted-foreground dark:text-muted-foreground hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {source === "billing" ? "Billing" : "Plans"}
        </Button>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-0">
          {[
            { step: 1, label: "Billing Details", icon: Building2 },
            { step: 2, label: "Payment Info", icon: CreditCard },
            { step: 3, label: "Confirm & Pay", icon: ShieldCheck },
          ].map(({ step, label, icon: Icon }, idx) => (
            <div key={step} className="flex items-center">
              {idx > 0 && (
                <div className="w-8 sm:w-16 h-0.5 bg-orange-200 dark:bg-orange-800" />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/40">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Processing Overlay */}
        {processing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-2xl text-center space-y-4 max-w-sm mx-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/40">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Processing Payment
              </h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we securely process your payment via
                Authorize.net...
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-green-600 dark:text-green-400">
                <Lock className="h-3 w-3" />
                <span>256-bit TLS encrypted</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-5">
          {/* ─── Left: Billing & Payment Form (3 cols) ─────────────────────── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                  Billing Information
                </CardTitle>
                <CardDescription>
                  Enter the billing details for this subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="flex items-center gap-1"
                    >
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={billing.firstName}
                      onChange={(e) =>
                        updateBilling("firstName", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("firstName")}
                      className={
                        showFieldError("firstName")
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {showFieldError("firstName") && (
                      <p className="text-xs text-red-500">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="flex items-center gap-1"
                    >
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={billing.lastName}
                      onChange={(e) =>
                        updateBilling("lastName", e.target.value)
                      }
                      onBlur={() => handleFieldBlur("lastName")}
                      className={
                        showFieldError("lastName")
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {showFieldError("lastName") && (
                      <p className="text-xs text-red-500">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@school.edu"
                      value={billing.email}
                      onChange={(e) => updateBilling("email", e.target.value)}
                      onBlur={() => handleFieldBlur("email")}
                      className={
                        showFieldError("email")
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {showFieldError("email") && (
                      <p className="text-xs text-red-500">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={billing.phone}
                      onChange={(e) => updateBilling("phone", e.target.value)}
                    />
                  </div>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    Institution / Company
                  </Label>
                  <Input
                    id="company"
                    placeholder="Springfield School District"
                    value={billing.company}
                    onChange={(e) => updateBilling("company", e.target.value)}
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Street Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="123 Main Street, Suite 100"
                    value={billing.address}
                    onChange={(e) => updateBilling("address", e.target.value)}
                    onBlur={() => handleFieldBlur("address")}
                    className={
                      showFieldError("address")
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {showFieldError("address") && (
                    <p className="text-xs text-red-500">{errors.address}</p>
                  )}
                </div>

                {/* Country */}
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={billing.country}
                    onValueChange={(v) => updateBilling("country", v)}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City, State, ZIP */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="Springfield"
                      value={billing.city}
                      onChange={(e) => updateBilling("city", e.target.value)}
                      onBlur={() => handleFieldBlur("city")}
                      className={
                        showFieldError("city")
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {showFieldError("city") && (
                      <p className="text-xs text-red-500">{errors.city}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">
                      State / Province <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="state"
                      placeholder="e.g. California, Telangana"
                      value={billing.state}
                      onChange={(e) => updateBilling("state", e.target.value)}
                      onBlur={() => handleFieldBlur("state")}
                      className={
                        showFieldError("state")
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {showFieldError("state") && (
                      <p className="text-xs text-red-500">{errors.state}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">
                      ZIP / Postal Code <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="zip"
                      placeholder="62704 or 500001"
                      maxLength={10}
                      value={billing.zip}
                      onChange={(e) => updateBilling("zip", e.target.value)}
                      onBlur={() => handleFieldBlur("zip")}
                      className={
                        showFieldError("zip")
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {showFieldError("zip") && (
                      <p className="text-xs text-red-500">{errors.zip}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Your card details are encrypted end-to-end and never stored on
                  our servers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Card Number */}
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">
                    Card Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="cardNumber"
                      placeholder="4111 1111 1111 1111"
                      value={card.number}
                      maxLength={19}
                      onChange={(e) =>
                        updateCard("number", formatCardNumber(e.target.value))
                      }
                      onBlur={() => handleFieldBlur("cardNumber")}
                      className={`pr-20 font-mono tracking-wider ${
                        showFieldError("cardNumber")
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      autoComplete="cc-number"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {cardBrand && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold px-1.5 py-0"
                        >
                          {cardBrand}
                        </Badge>
                      )}
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  {showFieldError("cardNumber") && (
                    <p className="text-xs text-red-500">{errors.cardNumber}</p>
                  )}
                </div>

                {/* Exp & CVV */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expMonth">
                      Month <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={card.expMonth}
                      onValueChange={(v) => updateCard("expMonth", v)}
                    >
                      <SelectTrigger
                        id="expMonth"
                        className={
                          showFieldError("expMonth") ? "border-red-500" : ""
                        }
                        onBlur={() => handleFieldBlur("expMonth")}
                      >
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => {
                          const m = String(i + 1).padStart(2, "0");
                          return (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {showFieldError("expMonth") && (
                      <p className="text-xs text-red-500">{errors.expMonth}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expYear">
                      Year <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={card.expYear}
                      onValueChange={(v) => updateCard("expYear", v)}
                    >
                      <SelectTrigger
                        id="expYear"
                        className={
                          showFieldError("expYear") ? "border-red-500" : ""
                        }
                        onBlur={() => handleFieldBlur("expYear")}
                      >
                        <SelectValue placeholder="YYYY" />
                      </SelectTrigger>
                      <SelectContent>
                        {years.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {showFieldError("expYear") && (
                      <p className="text-xs text-red-500">{errors.expYear}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">
                      CVV <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      maxLength={4}
                      value={card.cvv}
                      onChange={(e) =>
                        updateCard("cvv", e.target.value.replace(/\D/g, ""))
                      }
                      onBlur={() => handleFieldBlur("cvv")}
                      className={`text-center tracking-widest ${
                        showFieldError("cvv")
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                      autoComplete="cc-csc"
                    />
                    {showFieldError("cvv") && (
                      <p className="text-xs text-red-500">{errors.cvv}</p>
                    )}
                  </div>
                </div>

                {/* Security badge */}
                <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
                  <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Secured by <strong>Authorize.net</strong> — PCI-DSS Level 1
                    compliant. Your card data is encrypted via TLS and
                    tokenized. We never store card numbers.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit (mobile) */}
            <div className="lg:hidden">
              <Button
                onClick={handleSubmit}
                disabled={processing}
                className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600"
                size="lg"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Pay ${totalPrice.toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* ─── Right: Order Summary (2 cols) ─────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Order Summary Card */}
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-500 text-white rounded-t-lg">
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                  <CardDescription className="text-orange-100">
                    Review your subscription details
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {/* Plan info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {planConfig.name} Plan
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                        {planConfig.description}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-200"
                    >
                      {planConfig.badge || planConfig.id}
                    </Badge>
                  </div>

                  {/* Billing cycle toggle */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Billing Cycle</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBillingCycle("monthly")}
                        className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                          billingCycle === "monthly"
                            ? "border-orange-500 bg-orange-50 text-orange-600 ring-1 ring-orange-500 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-400"
                            : "border-border text-muted-foreground hover:border-slate-300 dark:border-slate-700 dark:text-muted-foreground dark:hover:border-slate-600"
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle("yearly")}
                        className={`relative rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                          billingCycle === "yearly"
                            ? "border-orange-500 bg-orange-50 text-orange-600 ring-1 ring-orange-500 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-400"
                            : "border-border text-muted-foreground hover:border-slate-300 dark:border-slate-700 dark:text-muted-foreground dark:hover:border-slate-600"
                        }`}
                      >
                        Yearly
                        <span className="ml-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                          -17%
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border dark:border-slate-700" />

                  {/* Price breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground dark:text-muted-foreground">
                        {planConfig.name} Plan (
                        {billingCycle === "monthly" ? "Monthly" : "Yearly"})
                      </span>
                      <span className="font-medium text-slate-900 dark:text-white">
                        ${totalPrice.toFixed(2)}
                      </span>
                    </div>
                    {billingCycle === "yearly" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400">
                          Yearly Discount (17%)
                        </span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          -${(monthlyPrice * 12 - totalPrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-border dark:border-slate-700 pt-3">
                      <div className="flex justify-between">
                        <span className="text-base font-semibold text-slate-900 dark:text-white">
                          Total Due Today
                        </span>
                        <span className="text-xl font-bold text-orange-500 dark:text-orange-400">
                          ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">
                        Billed{" "}
                        {billingCycle === "monthly"
                          ? "every month"
                          : "annually"}{" "}
                        in USD
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="border-t border-border dark:border-slate-700 pt-4">
                    <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wide mb-3">
                      Included Features
                    </p>
                    <ul className="space-y-2">
                      {planConfig.features.slice(0, 6).map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-foreground dark:text-slate-300"
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Submit (desktop) */}
                  <div className="hidden lg:block pt-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={processing}
                      className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600"
                      size="lg"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Pay ${totalPrice.toFixed(2)}
                        </>
                      )}
                    </Button>
                    <p className="mt-3 text-center text-[11px] text-muted-foreground dark:text-muted-foreground">
                      By completing this purchase you agree to our{" "}
                      <Link
                        href="/terms"
                        className="underline hover:text-muted-foreground"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="underline hover:text-muted-foreground"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-border dark:border-slate-800">
                  <ShieldCheck className="h-5 w-5 text-green-600 mb-1" />
                  <span className="text-[10px] font-medium text-muted-foreground dark:text-muted-foreground leading-tight">
                    PCI-DSS Compliant
                  </span>
                </div>
                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-border dark:border-slate-800">
                  <Lock className="h-5 w-5 text-orange-500 dark:text-orange-400 mb-1" />
                  <span className="text-[10px] font-medium text-muted-foreground dark:text-muted-foreground leading-tight">
                    256-bit TLS Encryption
                  </span>
                </div>
                <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-border dark:border-slate-800">
                  <CreditCard className="h-5 w-5 text-amber-600 mb-1" />
                  <span className="text-[10px] font-medium text-muted-foreground dark:text-muted-foreground leading-tight">
                    Authorize.net
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 dark:bg-slate-900/50 dark:border-slate-800 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground dark:text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} CampusIQ. All rights reserved.
            </p>
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>
                All transactions are secured and encrypted by Authorize.net
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <SessionProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Spinner className="h-8 w-8" />
          </div>
        }
      >
        <CheckoutInner />
      </Suspense>
    </SessionProvider>
  );
}
