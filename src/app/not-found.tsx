"use client";

import Link from "next/link";
import { useLocale } from "@/hooks/use-locale";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-8xl font-bold text-orange-500 dark:text-orange-400">
          {t("error.404")}
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
          {t("error.pageNotFound")}
        </h2>
        <p className="text-muted-foreground dark:text-gray-400 max-w-md mx-auto">
          {t("error.pageNotFoundMsg")}
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-orange-50 dark:bg-orange-950/300 text-white font-medium hover:bg-orange-500 transition-colors"
          >
            {t("error.goToDashboard")}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {t("common.home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
