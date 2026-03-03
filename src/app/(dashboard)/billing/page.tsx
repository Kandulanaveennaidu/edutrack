"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpCircle,
  Receipt,
  Loader2,
  Crown,
  Download,
  XCircle,
  Shield,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showSuccess, showError } from "@/lib/alerts";
import Swal from "sweetalert2";
import { Spinner } from "@/components/ui/spinner";
import { usePermissions } from "@/hooks/use-permissions";

// ─── Plan Prices (USD — Authorize.net) ───────────────────────────────────────
const PLAN_PRICES: Record<string, number> = {
  starter: 0,
  basic: 11.99,
  pro: 23.99,
  enterprise: 47.99,
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter (Free)",
  basic: "Basic",
  pro: "Professional",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "bg-muted text-foreground dark:bg-card dark:text-gray-200",
  basic:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  pro: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  enterprise:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

interface SubscriptionInfo {
  plan: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  billingCycle: string;
  amount: number;
}

interface PaymentRecord {
  _id: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  type: string;
  plan: string;
  status: string;
  createdAt: string;
}

interface BillingSummary {
  totalPaid: number;
  activePlan: string;
  nextDueDate: string | null;
  pendingAmount: number;
}

export default function BillingPage() {
  const { data: session, update: updateSession } = useSession();
  const { canEdit } = usePermissions("billing");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);

  const fetchBilling = useCallback(async () => {
    try {
      const res = await fetch("/api/billing");
      if (!res.ok) throw new Error("Failed to fetch billing data");
      const data = await res.json();
      setSubscription(data.subscription);
      setPayments(data.payments || []);
      setSummary(data.summary);
    } catch {
      showError("Error", "Failed to load billing information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  // Check if user is admin
  if (session?.user?.role && session.user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              Only administrators can access the billing page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Navigate to Checkout Page ───────────────────────────────────────────
  const handleUpgrade = (plan: string) => {
    if (plan === "starter") return;
    router.push(`/checkout?plan=${plan}&cycle=monthly&source=billing`);
  };

  const handleRenew = () => {
    if (!subscription) return;
    handleUpgrade(subscription.plan);
  };

  const downloadInvoice = async (payment: PaymentRecord) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const schoolName = session?.user?.name || "Institution";
      const schoolEmail = session?.user?.email || "";
      const isUsd = payment.currency === "USD" || !payment.currency;
      const amountStr = isUsd
        ? formatCurrency(payment.amount)
        : `$${payment.amount.toFixed(2)}`;
      const invoiceDate = formatDate(payment.createdAt);
      const invoiceNo = payment.orderId.replace("ord_", "INV-").toUpperCase();

      // ─── Page dimensions ───────────────────────────────────────────
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 20;

      // ─── Premium gradient header bar ───────────────────────────────
      doc.setFillColor(67, 56, 202); // orange-600
      doc.rect(0, 0, pageW, 48, "F");
      doc.setFillColor(79, 70, 229); // orange-500 overlay strip
      doc.rect(0, 42, pageW, 6, "F");

      // Logo text in header
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("CampusIQ", margin, 28);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(199, 210, 254); // orange-200
      doc.text("Institution Management Platform", margin, 37);

      // INVOICE label in header
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("INVOICE", pageW - margin, 28, { align: "right" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(199, 210, 254);
      doc.text(`#${invoiceNo}`, pageW - margin, 37, { align: "right" });

      // ─── Invoice meta info section ─────────────────────────────────
      let y = 62;

      // Left column — From
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text("FROM", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55); // gray-800
      doc.text("CampusIQ Inc.", margin, y + 8);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("billing@campusiq.com", margin, y + 15);
      doc.text("www.campusiq.com", margin, y + 21);

      // Right column — Bill To
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 114, 128);
      doc.text("BILL TO", 120, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.text(schoolName, 120, y + 8);
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      if (schoolEmail) doc.text(schoolEmail, 120, y + 15);

      // ─── Invoice details cards ─────────────────────────────────────
      y = 98;
      const cardW = (pageW - margin * 2 - 12) / 3;

      // Card backgrounds
      const cards = [
        { label: "Invoice Date", value: invoiceDate },
        { label: "Payment Status", value: payment.status.toUpperCase() },
        { label: "Amount Due", value: amountStr },
      ];

      cards.forEach((card, i) => {
        const cx = margin + i * (cardW + 6);
        // Card bg
        doc.setFillColor(249, 250, 251); // gray-50
        doc.roundedRect(cx, y, cardW, 22, 3, 3, "F");
        // Card border
        doc.setDrawColor(229, 231, 235); // gray-200
        doc.roundedRect(cx, y, cardW, 22, 3, 3, "S");
        // Label
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(107, 114, 128);
        doc.text(card.label.toUpperCase(), cx + 6, y + 8);
        // Value
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        if (card.label === "Payment Status") {
          doc.setTextColor(
            payment.status === "paid" ? 22 : 220,
            payment.status === "paid" ? 163 : 38,
            payment.status === "paid" ? 74 : 38,
          );
        } else if (card.label === "Amount Due") {
          doc.setTextColor(67, 56, 202); // orange-600
        } else {
          doc.setTextColor(31, 41, 55);
        }
        doc.text(card.value, cx + 6, y + 17);
      });

      // ─── Items table ───────────────────────────────────────────────
      y = 134;

      // Table header
      doc.setFillColor(67, 56, 202); // orange-600
      doc.roundedRect(margin, y, pageW - margin * 2, 12, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("#", margin + 6, y + 8);
      doc.text("DESCRIPTION", margin + 18, y + 8);
      doc.text("PLAN", 105, y + 8);
      doc.text("QTY", 135, y + 8);
      doc.text("RATE", 152, y + 8);
      doc.text("AMOUNT", pageW - margin - 6, y + 8, { align: "right" });

      // Table row 1
      y += 12;
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y, pageW - margin * 2, 14, "F");
      doc.setDrawColor(229, 231, 235);
      doc.line(margin, y + 14, pageW - margin, y + 14);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(31, 41, 55);
      doc.text("1", margin + 6, y + 9);
      doc.text(
        payment.type === "subscription"
          ? "SaaS Platform Subscription"
          : "Fee Payment",
        margin + 18,
        y + 9,
      );
      doc.text(PLAN_LABELS[payment.plan] || payment.plan, 105, y + 9);
      doc.text("1", 137, y + 9);
      doc.text(amountStr, 152, y + 9);
      doc.setFont("helvetica", "bold");
      doc.text(amountStr, pageW - margin - 6, y + 9, { align: "right" });

      // ─── Totals section ────────────────────────────────────────────
      y += 24;
      const totalsX = 125;

      // Subtotal
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("Subtotal", totalsX, y);
      doc.setTextColor(31, 41, 55);
      doc.text(amountStr, pageW - margin - 6, y, { align: "right" });

      // Tax
      y += 8;
      doc.setTextColor(107, 114, 128);
      doc.text("Tax (0%)", totalsX, y);
      doc.setTextColor(31, 41, 55);
      doc.text("$0.00", pageW - margin - 6, y, { align: "right" });

      // Discount line
      y += 8;
      doc.setTextColor(107, 114, 128);
      doc.text("Discount", totalsX, y);
      doc.setTextColor(22, 163, 74); // green
      doc.text("$0.00", pageW - margin - 6, y, { align: "right" });

      // Total divider
      y += 5;
      doc.setDrawColor(67, 56, 202);
      doc.setLineWidth(0.5);
      doc.line(totalsX, y, pageW - margin, y);
      doc.setLineWidth(0.2);

      // Grand Total
      y += 10;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(67, 56, 202);
      doc.text("TOTAL", totalsX, y);
      doc.setFontSize(14);
      doc.text(amountStr, pageW - margin - 6, y, { align: "right" });

      // ─── Transaction details ───────────────────────────────────────
      y += 20;
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, "F");
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, "S");

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 114, 128);
      doc.text("TRANSACTION DETAILS", margin + 8, y + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      doc.text(`Order ID: ${payment.orderId}`, margin + 8, y + 16);
      doc.text(
        `Transaction ID: ${payment.paymentId || "N/A"}`,
        margin + 8,
        y + 23,
      );
      doc.text(`Payment Method: Credit Card`, 120, y + 16);
      doc.text(`Currency: ${payment.currency || "USD"}`, 120, y + 23);

      // ─── Terms & Notes ─────────────────────────────────────────────
      y += 38;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(107, 114, 128);
      doc.text("TERMS & CONDITIONS", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(
        "1. This invoice is auto-generated and valid without signature.",
        margin,
        y + 7,
      );
      doc.text(
        "2. Subscription is billed according to the selected billing cycle.",
        margin,
        y + 13,
      );
      doc.text(
        "3. Refunds are processed as per our Refund Policy within 30 days.",
        margin,
        y + 19,
      );
      doc.text("4. For queries, contact billing@campusiq.com.", margin, y + 25);

      // ─── Footer bar ───────────────────────────────────────────────
      doc.setFillColor(249, 250, 251);
      doc.rect(0, pageH - 24, pageW, 24, "F");
      doc.setDrawColor(229, 231, 235);
      doc.line(0, pageH - 24, pageW, pageH - 24);

      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(156, 163, 175);
      doc.text(
        "CampusIQ Inc. \u2022 Institution Management Platform \u2022 www.campusiq.com \u2022 billing@campusiq.com",
        pageW / 2,
        pageH - 16,
        { align: "center" },
      );
      doc.text(
        `Generated on ${new Date().toLocaleString()} \u2022 Payments processed securely via Authorize.net`,
        pageW / 2,
        pageH - 10,
        { align: "center" },
      );

      // ─── Thank You strip ──────────────────────────────────────────
      const thankY = y + 34;
      if (thankY < pageH - 40) {
        doc.setFillColor(238, 242, 255); // orange-50
        doc.roundedRect(margin, thankY, pageW - margin * 2, 16, 3, 3, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(67, 56, 202);
        doc.text("Thank you for choosing CampusIQ!", pageW / 2, thankY + 10, {
          align: "center",
        });
      }

      doc.save(`CampusIQ-Invoice-${invoiceNo}.pdf`);
    } catch {
      showError("Error", "Failed to generate invoice PDF");
    }
  };

  const handleCancelSubscription = async () => {
    const result = await Swal.fire({
      title: "Cancel Subscription?",
      text: "Your subscription will remain active until the end of the current billing period. You will then be downgraded to the Starter plan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel it",
      cancelButtonText: "Keep my plan",
      confirmButtonColor: "#ef4444",
    });
    if (!result.isConfirmed) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/subscriptions", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel");
      }
      await updateSession();
      showSuccess(
        "Cancelled",
        "Your subscription has been cancelled. You are now on the free Starter plan.",
      );
      router.push("/plans");
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to cancel subscription",
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      trial:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      cancelled: "bg-muted text-foreground dark:bg-card dark:text-gray-200",
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      created:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      refunded:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    };
    return (
      <Badge className={styles[status] || "bg-muted text-foreground"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-gray-100">
            Billing & Invoices
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, view payment history, and download
            invoices.
          </p>
        </div>
        {canEdit &&
          subscription &&
          subscription.status !== "active" &&
          subscription.plan !== "starter" && (
            <Button onClick={handleRenew} disabled={processing}>
              {processing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpCircle className="mr-2 h-4 w-4" />
              )}
              Renew Subscription
            </Button>
          )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.totalPaid || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plan</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {PLAN_LABELS[summary?.activePlan || "starter"]}
            </div>
            <p className="text-xs text-muted-foreground">
              {subscription ? getStatusBadge(subscription.status) : "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Due Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(summary?.nextDueDate || null)}
            </div>
            <p className="text-xs text-muted-foreground">
              {subscription?.billingCycle === "yearly"
                ? "Annual billing"
                : "Monthly billing"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Amount
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary?.pendingAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <div className="mt-1">
                  <Badge className={PLAN_COLORS[subscription.plan] || ""}>
                    {PLAN_LABELS[subscription.plan] || subscription.plan}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  {getStatusBadge(subscription.status)}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {subscription.status === "trial"
                    ? "Trial Ends"
                    : "Period Ends"}
                </p>
                <p className="mt-1 font-medium">
                  {subscription.status === "trial"
                    ? formatDate(subscription.trialEndsAt)
                    : formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rate</p>
                <p className="mt-1 font-medium">
                  {formatCurrency(PLAN_PRICES[subscription.plan] || 0)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No active subscription found.
            </p>
          )}
          {subscription &&
            subscription.status === "active" &&
            subscription.plan !== "starter" &&
            canEdit && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={handleCancelSubscription}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="mr-2 h-4 w-4" />
                  )}
                  Cancel Subscription
                </Button>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Upgrade Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5" />
            Available Plans
          </CardTitle>
          <CardDescription>
            Upgrade or change your subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(PLAN_PRICES).map(([planId, price]) => {
              const isCurrent = subscription?.plan === planId;
              return (
                <div
                  key={planId}
                  className={`rounded-lg border p-4 transition-all ${
                    isCurrent
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950 dark:border-orange-400"
                      : "border-border hover:border-border dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{PLAN_LABELS[planId]}</h3>
                    {isCurrent && (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold mb-1">
                    {price === 0 ? "Free" : `$${price.toFixed(2)}`}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {price === 0 ? "7-day trial" : "per month"}
                  </p>
                  {canEdit && planId !== "starter" && !isCurrent && (
                    <Button
                      className="w-full"
                      variant={planId === "pro" ? "default" : "outline"}
                      onClick={() => handleUpgrade(planId)}
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      {isCurrent ? "Current Plan" : "Upgrade"}
                    </Button>
                  )}
                  {canEdit &&
                    isCurrent &&
                    subscription?.status !== "active" &&
                    planId !== "starter" && (
                      <Button
                        className="w-full"
                        onClick={handleRenew}
                        disabled={processing}
                      >
                        {processing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowUpCircle className="mr-2 h-4 w-4" />
                        )}
                        Renew
                      </Button>
                    )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateway Info */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Secure Payments by Authorize.net
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                All transactions are encrypted and processed through
                Authorize.net&apos;s PCI-DSS compliant payment gateway. Your
                card details are tokenized via Accept.js and never stored on our
                servers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>
            All transactions for your institution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[120px] truncate">
                        {payment.orderId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.type === "subscription"
                            ? "Subscription"
                            : "Fee"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {PLAN_LABELS[payment.plan] || payment.plan}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.status === "paid" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Download Invoice"
                            onClick={() => downloadInvoice(payment)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
