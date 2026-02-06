"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
  UserCog,
  FileText,
  Settings,
  GraduationCap,
  X,
  Bell,
  ClipboardList,
  User,
  QrCode,
  UserCheck,
  Building2,
  CalendarDays,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Mark Attendance",
    href: "/attendance/mark",
    icon: CalendarCheck,
  },
  {
    name: "QR Attendance",
    href: "/attendance/qr",
    icon: QrCode,
  },
  {
    name: "Attendance History",
    href: "/attendance/history",
    icon: Calendar,
  },
  {
    name: "Students",
    href: "/students",
    icon: Users,
  },
  {
    name: "Teachers",
    href: "/teachers",
    icon: UserCog,
    adminOnly: true,
  },
  {
    name: "Timetable",
    href: "/timetable",
    icon: BookOpen,
  },
  {
    name: "Room Booking",
    href: "/rooms",
    icon: Building2,
  },
  {
    name: "Visitors",
    href: "/visitors",
    icon: UserCheck,
    adminOnly: true,
  },
  {
    name: "Leave Requests",
    href: "/leaves",
    icon: ClipboardList,
  },
  {
    name: "Holidays",
    href: "/holidays",
    icon: CalendarDays,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    name: "Emergency Alerts",
    href: "/emergency",
    icon: AlertTriangle,
    adminOnly: true,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const filteredNav = navigation.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-bold text-white">EduTrack</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-white lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNav.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-slate-700 p-4">
            <p className="text-xs text-slate-400">
              EduTrack v2.0.0
              <br />
              Smart School Management
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
