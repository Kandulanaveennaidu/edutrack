"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, User, Sun, Moon, Monitor, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
// import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { useLocale } from "@/hooks/use-locale";

// Locale codes for date formatting
const DATE_LOCALES: Record<string, string> = {
  en: "en-US",
  hi: "hi-IN",
  te: "te-IN",
  ta: "ta-IN",
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const { t, locale } = useLocale();

  const dateLocale = DATE_LOCALES[locale] || "en-US";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/70 backdrop-blur-2xl backdrop-saturate-[200%] px-4 lg:px-6 shadow-[0_1px_3px_hsl(20_14%_10%/0.03)] dark:shadow-[0_1px_0_hsl(20_12%_14%/0.8)]">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-accent"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="hidden lg:block">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            {t("header.welcome")},{" "}
            <span className="text-gradient-primary">
              {session?.user?.name?.split(" ")[0] || "User"}
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(dateLocale, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-2">
        {/* Home Link */}
        <Link href="/">
          <Button variant="ghost" size="icon" title={t("header.backToHome")}>
            <Home className="h-5 w-5" />
          </Button>
        </Link>

        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              {resolvedTheme === "dark" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" /> {t("header.light")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" /> {t("header.dark")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="mr-2 h-4 w-4" /> {t("header.system")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Language Switcher — disabled for now */}
        {/* <LanguageSwitcher /> */}

        {/* Notifications — real-time dropdown */}
        <NotificationDropdown />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 ring-2 ring-white/20 dark:ring-white/10">
                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {session?.user?.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("header.institution")}: {session?.user?.school_id}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/profile">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                {t("header.profile")}
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("header.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
