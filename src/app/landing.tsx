"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Check,
  Zap,
  Users,
  CalendarCheck,
  CreditCard,
  Shield,
  BarChart3,
  BusFront,
  Library,
  BedDouble,
  ArrowRight,
  Star,
  Play,
  Globe,
  Clock,
  Phone,
  Mail,
  MapPin,
  BookOpen,
  FileText,
  DollarSign,
  Bell,
  QrCode,
  Hotel,
  Briefcase,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Award,
  TrendingUp,
  HeadphonesIcon,
  Settings,
  Layers,
  Database,
  LockKeyhole,
  Smartphone,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS, type PlanConfig } from "@/lib/plans";
import { cn } from "@/lib/utils";

/* ─────────────────────── PLAN CARD ─────────────────────── */

function PlanCard({
  plan,
  billing,
}: {
  plan: PlanConfig;
  billing: "monthly" | "yearly";
}) {
  const price = billing === "monthly" ? plan.price : plan.yearlyPrice;
  const monthlyEquivalent =
    billing === "yearly" && plan.yearlyPrice > 0
      ? Math.round(plan.yearlyPrice / 12)
      : null;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:bg-slate-900",
        plan.popular
          ? "border-blue-500 ring-2 ring-blue-500 shadow-xl shadow-blue-100 dark:shadow-blue-950"
          : "border-slate-200 dark:border-slate-700",
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-blue-600 px-4 py-1 text-xs font-semibold text-white shadow">
            Most Popular
          </span>
        </div>
      )}
      {plan.badge && !plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-100 px-4 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          {plan.badge}
        </span>
      )}

      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
        {plan.name}
      </h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {plan.description}
      </p>

      <div className="mt-5 mb-6">
        {plan.price === 0 ? (
          <div className="text-4xl font-bold text-slate-900 dark:text-white">
            Free
          </div>
        ) : (
          <>
            <div className="text-4xl font-bold text-slate-900 dark:text-white">
              ₹{price.toLocaleString("en-IN")}
              <span className="text-base font-normal text-slate-500">
                /{billing === "monthly" ? "mo" : "yr"}
              </span>
            </div>
            {monthlyEquivalent && (
              <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                ₹{monthlyEquivalent.toLocaleString("en-IN")}/month billed yearly
              </p>
            )}
          </>
        )}
      </div>

      <ul className="flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
          >
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            {f}
          </li>
        ))}
      </ul>

      <Link href="/register" className="mt-6 block">
        <Button
          className="w-full"
          size="lg"
          variant={plan.popular ? "default" : "outline"}
        >
          {plan.price === 0 ? "Start Free Trial" : "Get Started"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

/* ─────────────────────── FEATURE HIGHLIGHTS ─────────────────────── */

const FEATURE_HIGHLIGHTS: {
  icon: LucideIcon;
  title: string;
  desc: string;
  color: string;
}[] = [
  {
    icon: Users,
    title: "Student Management",
    desc: "Complete student lifecycle from admission to graduation — enrollment, profiles, parent info, class assignments, and more.",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    icon: CalendarCheck,
    title: "Smart Attendance",
    desc: "QR-based, manual, subject-wise and teacher attendance. Real-time tracking with automated reports.",
    color:
      "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    icon: GraduationCap,
    title: "Exam & Grades",
    desc: "Full exam scheduling, grade entry, automatic GPA calculation, and downloadable report cards.",
    color:
      "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    icon: DollarSign,
    title: "Fee Management",
    desc: "Create fee structures, track payments, generate receipts, and send automated reminders.",
    color:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    icon: BedDouble,
    title: "Hostel Management",
    desc: "Room & bed allocation, floor management, warden assignment, and occupancy tracking.",
    color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  },
  {
    icon: Library,
    title: "Library System",
    desc: "Book catalog, issuing, returns, fine management with barcode scanning support.",
    color:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  {
    icon: BusFront,
    title: "Transport",
    desc: "Route planning, vehicle tracking, driver details, and student transport allocation.",
    color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  {
    icon: BarChart3,
    title: "Reports & Analytics",
    desc: "Comprehensive dashboards, attendance reports, financial summaries with CSV/PDF exports.",
    color: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
  },
  {
    icon: BookOpen,
    title: "Academic Management",
    desc: "Departments, subjects, semesters, academic years, and student promotions — all in one place.",
    color:
      "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    icon: Briefcase,
    title: "Faculty Workload",
    desc: "Track and allocate teaching hours, class loads, and workload reports per teacher.",
    color: "bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400",
  },
  {
    icon: CreditCard,
    title: "Salary Management",
    desc: "Automated salary calculation, payslips, deduction management, and payment history.",
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  },
  {
    icon: Shield,
    title: "Roles & Permissions",
    desc: "Granular role-based access control with custom roles and per-module permissions.",
    color:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
];

/* ─────────────────────── HOW IT WORKS ─────────────────────── */

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Register Your Institution",
    desc: "Create your school account in under 2 minutes. No credit card required for the free trial.",
    icon: FileText,
  },
  {
    step: "02",
    title: "Configure & Customize",
    desc: "Set up classes, add teachers, configure fee structures, and customize settings for your school.",
    icon: Settings,
  },
  {
    step: "03",
    title: "Add Students & Staff",
    desc: "Import students via bulk upload or add individually. Assign roles, permissions and access levels.",
    icon: Users,
  },
  {
    step: "04",
    title: "Go Live & Manage",
    desc: "Start taking attendance, managing fees, scheduling exams — everything from your dashboard.",
    icon: Sparkles,
  },
];

/* ─────────────────────── STATS ─────────────────────── */

const STATS = [
  { value: "500+", label: "Schools", icon: Globe },
  { value: "1M+", label: "Students Managed", icon: Users },
  { value: "99.9%", label: "Uptime", icon: TrendingUp },
  { value: "24/7", label: "Support", icon: HeadphonesIcon },
];

/* ─────────────────────── TESTIMONIALS ─────────────────────── */

const TESTIMONIALS = [
  {
    name: "Dr. Rajesh Kumar",
    role: "Principal, Delhi Public School",
    quote:
      "EduTrack transformed how we manage our school. Attendance tracking that used to take hours now happens in minutes. The fee management module alone saved us from hiring an extra accountant.",
    rating: 5,
    avatar: "RK",
  },
  {
    name: "Priya Sharma",
    role: "Admin, St. Mary's Academy",
    quote:
      "We switched from paper-based systems to EduTrack and the difference is night and day. Parents love the real-time attendance notifications. The QR code attendance feature is a game changer.",
    rating: 5,
    avatar: "PS",
  },
  {
    name: "Mohammed Fahad",
    role: "Director, Al-Ameen Group of Schools",
    quote:
      "Managing 3 branches with 5000+ students used to be chaotic. EduTrack's multi-tenant architecture and role-based access made centralized management possible. Highly recommended!",
    rating: 5,
    avatar: "MF",
  },
];

/* ─────────────────────── WHY EDUTRACK ─────────────────────── */

const WHY_EDUTRACK = [
  {
    icon: LockKeyhole,
    title: "Secure & Reliable",
    desc: "Enterprise-grade security with encrypted data, role-based access, and automatic backups.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    desc: "Access from any device — desktop, tablet, or mobile. Fully responsive design.",
  },
  {
    icon: Layers,
    title: "Modular Architecture",
    desc: "Only pay for modules you need. Start small and add features as your institution grows.",
  },
  {
    icon: Database,
    title: "Cloud-Based",
    desc: "No software to install. Access your data from anywhere with automatic updates.",
  },
  {
    icon: Monitor,
    title: "Real-Time Dashboard",
    desc: "Live statistics, instant notifications, and real-time insights at your fingertips.",
  },
  {
    icon: HeadphonesIcon,
    title: "Dedicated Support",
    desc: "Priority support with dedicated account managers for Pro and Enterprise plans.",
  },
];

/* ─────────────────────── FAQ ─────────────────────── */

const FAQS = [
  {
    q: "How long is the free trial?",
    a: "EduTrack offers a 7-day free trial on the Starter plan. You get access to core features including student management, attendance tracking, and dashboard — no credit card required.",
  },
  {
    q: "Can I upgrade or downgrade my plan anytime?",
    a: "Yes! You can upgrade your plan at any time and the billing will be prorated. Downgrades take effect at the end of your current billing cycle.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use industry-standard encryption, multi-tenant data isolation, and automatic backups. Each school's data is completely separated and cannot be accessed by other institutions.",
  },
  {
    q: "Do you support bulk student import?",
    a: "Yes. You can import students, teachers, and other data via CSV files. We also provide downloadable templates to make the process seamless.",
  },
  {
    q: "Can I manage multiple branches?",
    a: "Yes, our Enterprise plan supports multi-branch management with centralized admin control, separate data for each branch, and consolidated reporting.",
  },
  {
    q: "What kind of support do you offer?",
    a: "We offer email support for all plans, priority support for Pro plans, and a dedicated account manager for Enterprise plans. Our support team is available 24/7.",
  },
];

/* ═══════════════════════ MAIN COMPONENT ═══════════════════════ */

export default function LandingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* ─── NAVBAR ─── */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              EduTrack
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Pricing
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Testimonials
            </a>
            <a
              href="#faq"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white px-4 pb-24 pt-32 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        {/* Decorative blobs */}
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute top-40 right-1/4 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/20" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <Zap className="h-4 w-4" />
            Trusted by 500+ institutions across India
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl">
            The Complete{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              School Management
            </span>{" "}
            Platform
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-slate-600 dark:text-slate-400 sm:text-xl">
            Streamline attendance, fees, exams, hostel, library, transport,
            salary — and 20+ more modules. Built for modern schools, trusted by
            thousands.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button
                size="lg"
                className="h-14 px-10 text-lg shadow-lg shadow-blue-500/25"
              >
                Start Free 7-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-10 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              7-day free trial
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-green-500" />
              20+ modules
            </div>
          </div>
        </div>

        {/* Hero Dashboard Preview */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b px-4 py-2 dark:border-slate-700">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-yellow-400" />
                <div className="h-3 w-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 text-center text-xs text-slate-400">
                app.edutrack.in/dashboard
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
              {[
                {
                  label: "Total Students",
                  value: "2,450",
                  color: "text-blue-600",
                  bg: "bg-blue-50 dark:bg-blue-900/20",
                },
                {
                  label: "Present Today",
                  value: "2,180",
                  color: "text-green-600",
                  bg: "bg-green-50 dark:bg-green-900/20",
                },
                {
                  label: "Fee Collected",
                  value: "₹12.5L",
                  color: "text-amber-600",
                  bg: "bg-amber-50 dark:bg-amber-900/20",
                },
                {
                  label: "Active Teachers",
                  value: "156",
                  color: "text-purple-600",
                  bg: "bg-purple-50 dark:bg-purple-900/20",
                },
              ].map((stat) => (
                <div key={stat.label} className={cn("rounded-lg p-4", stat.bg)}>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xl font-bold sm:text-2xl",
                      stat.color,
                    )}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 px-6 pb-6 sm:grid-cols-3">
              <div className="col-span-1 rounded-lg border border-slate-200 p-4 dark:border-slate-700 sm:col-span-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Attendance This Week
                </p>
                <div className="mt-3 flex items-end gap-2">
                  {[85, 92, 88, 95, 90, 87, 93].map((v, i) => (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div
                        className="w-full rounded-t bg-blue-500 dark:bg-blue-600"
                        style={{ height: `${v * 0.8}px` }}
                      />
                      <span className="text-[10px] text-slate-400">
                        {["M", "T", "W", "T", "F", "S", "S"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Quick Actions
                </p>
                <div className="mt-3 space-y-2">
                  {[
                    "Mark Attendance",
                    "Add Student",
                    "Create Exam",
                    "Send Notice",
                  ].map((action) => (
                    <div
                      key={action}
                      className="flex items-center gap-2 rounded bg-slate-50 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect */}
          <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-r from-blue-400/20 to-indigo-400/20 blur-2xl dark:from-blue-600/10 dark:to-indigo-600/10" />
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="border-y border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-12 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className="mx-auto mb-2 h-6 w-6 text-blue-600" />
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <Layers className="h-4 w-4" />
              20+ Powerful Modules
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              Everything You Need to Run Your School
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Comprehensive tools designed for modern education management —
              from admission to graduation.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {FEATURE_HIGHLIGHTS.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900"
              >
                <div
                  className={cn(
                    "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl",
                    f.color,
                  )}
                >
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        id="how-it-works"
        className="bg-slate-50 px-4 py-24 dark:bg-slate-900/50"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <Sparkles className="h-4 w-4" />
              Simple Setup
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              Get Started in 4 Easy Steps
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Setting up EduTrack takes minutes, not days. Here&apos;s how it
              works.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item, idx) => (
              <div key={item.step} className="relative">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute top-12 left-full hidden w-full lg:block">
                    <div className="h-0.5 w-full bg-gradient-to-r from-blue-300 to-transparent dark:from-blue-700" />
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/25">
                    <item.icon className="h-10 w-10 text-white" />
                  </div>
                  <span className="mb-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                    STEP {item.step}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY EDUTRACK ─── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                <Award className="h-4 w-4" />
                Why Choose Us
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                Built for Schools That Want to Go Digital
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                EduTrack is designed from the ground up for Indian schools and
                institutions. We understand your workflows, compliance needs,
                and budget constraints.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Multi-tenant architecture — each school's data is completely isolated",
                  "Built-in role-based access control (Admin, Teacher, Student, Parent)",
                  "Works on any device — desktop, tablet, or smartphone",
                  "Indian Rupee billing with GST-compliant invoicing",
                  "Supports regional languages and local academic patterns",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <Link href="/register" className="mt-8 inline-block">
                <Button size="lg" className="h-12 px-8">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {WHY_EDUTRACK.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  <item.icon className="mb-3 h-8 w-8 text-blue-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── MODULES SHOWCASE ─── */}
      <section className="bg-slate-900 px-4 py-24 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
              One Platform, Endless Possibilities
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
              Every module works together seamlessly to give you a complete
              school management solution.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[
              { icon: Users, label: "Students" },
              { icon: GraduationCap, label: "Teachers" },
              { icon: CalendarCheck, label: "Attendance" },
              { icon: QrCode, label: "QR Attendance" },
              { icon: FileText, label: "Exams" },
              { icon: DollarSign, label: "Fees" },
              { icon: CreditCard, label: "Salary" },
              { icon: BookOpen, label: "Academics" },
              { icon: Clock, label: "Timetable" },
              { icon: Library, label: "Library" },
              { icon: Hotel, label: "Hostel" },
              { icon: BusFront, label: "Transport" },
              { icon: Bell, label: "Notifications" },
              { icon: BarChart3, label: "Reports" },
              { icon: Shield, label: "Permissions" },
              { icon: Briefcase, label: "Workload" },
              { icon: Database, label: "Backup" },
              { icon: Settings, label: "Settings" },
            ].map((mod) => (
              <div
                key={mod.label}
                className="group flex flex-col items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 p-4 transition-all hover:border-blue-500 hover:bg-blue-500/10"
              >
                <mod.icon className="h-7 w-7 text-slate-400 transition-colors group-hover:text-blue-400" />
                <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                  {mod.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="testimonials" className="px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              <Star className="h-4 w-4" />
              Testimonials
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Loved by Schools Across India
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              Don&apos;t just take our word for it — hear from the educators who
              use EduTrack every day.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {t.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section
        id="pricing"
        className="bg-slate-50 px-4 py-24 dark:bg-slate-900/50"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
              <CreditCard className="h-4 w-4" />
              Pricing Plans
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
              Choose the plan that fits your institution. Upgrade anytime.
            </p>

            {/* Billing toggle */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <span
                className={cn(
                  "text-sm font-medium",
                  billing === "monthly"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500",
                )}
              >
                Monthly
              </span>
              <button
                type="button"
                onClick={() =>
                  setBilling((b) => (b === "monthly" ? "yearly" : "monthly"))
                }
                className="relative h-7 w-14 rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div
                  className={cn(
                    "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    billing === "yearly" ? "translate-x-8" : "translate-x-1",
                  )}
                />
              </button>
              <span
                className={cn(
                  "text-sm font-medium",
                  billing === "yearly"
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500",
                )}
              >
                Yearly{" "}
                <span className="text-xs font-semibold text-green-600">
                  Save 17%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} billing={billing} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              <Bell className="h-4 w-4" />
              FAQ
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Got questions? We&apos;ve got answers.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {faq.q}
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 shrink-0 text-slate-400 transition-transform",
                      openFaq === idx && "rotate-90",
                    )}
                  />
                </button>
                {openFaq === idx && (
                  <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-20">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 h-full w-full">
          <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Ready to Transform Your Institution?
          </h2>
          <p className="mt-6 text-lg text-blue-100">
            Join 500+ schools already using EduTrack to manage their
            institutions efficiently. Start your free 7-day trial today — no
            credit card required.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="h-14 bg-white px-10 text-lg text-blue-600 hover:bg-blue-50 shadow-lg"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-14 border-white/30 px-10 text-lg text-white hover:bg-white/10"
              >
                Sign In to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-800 bg-slate-900 px-4 py-16 dark:border-slate-800">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-4">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-blue-500" />
                <span className="text-xl font-bold text-white">EduTrack</span>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                The complete school management platform trusted by 500+
                institutions across India.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a
                    href="#features"
                    className="transition-colors hover:text-white"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="transition-colors hover:text-white"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="transition-colors hover:text-white"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#testimonials"
                    className="transition-colors hover:text-white"
                  >
                    Testimonials
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="mb-4 font-semibold text-white">Contact</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-400" />
                  support@edutrack.in
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  +91 1800-123-4567
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  Hyderabad, Telangana, India
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} EduTrack. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-400">
              <Link
                href="/login"
                className="transition-colors hover:text-white"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="transition-colors hover:text-white"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
