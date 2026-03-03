"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { LoadingPage } from "@/components/ui/spinner";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <LoadingPage />;
  }

  if (!session) {
    redirect("/login");
  }

  // Redirect users with expired trial to the plans page.
  // "cancelled" users are downgraded to the free Starter plan
  // and should still have dashboard access.
  const subStatus = session.user?.subscriptionStatus;
  if (subStatus === "expired") {
    redirect("/");
  }

  return <DashboardShell>{children}</DashboardShell>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SessionProvider>
  );
}
