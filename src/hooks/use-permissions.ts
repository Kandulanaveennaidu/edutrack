"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";
import type { MenuPermissionData } from "@/lib/auth";

export interface Permissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Hook that returns granular permissions (view/add/edit/delete) for a given module.
 *
 * - System admins (no custom role) → full access.
 * - Users with a custom role → permissions come from the role's menu-permission matrix.
 * - Users without a custom role (regular teacher/student/parent) → full access
 *   for modules they can reach (sidebar already hides inaccessible modules).
 */
export function usePermissions(module: string): Permissions {
  const { data: session } = useSession();

  return useMemo(() => {
    const full: Permissions = {
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
    };

    if (!session?.user) return full;

    const customRole = session.user.customRole;
    const menuPermissions =
      (session.user.menuPermissions as MenuPermissionData[]) || [];

    // Users without a custom role get full access (system roles like admin/teacher)
    if (!customRole || menuPermissions.length === 0) return full;

    // Custom role users → look up permission for this module
    const perm = menuPermissions.find((p) => p.menu === module);

    // If module is not in the permission list, grant full access by default
    if (!perm) return full;

    return {
      canView: perm.view,
      canAdd: perm.add,
      canEdit: perm.edit,
      canDelete: perm.delete,
    };
  }, [session, module]);
}
