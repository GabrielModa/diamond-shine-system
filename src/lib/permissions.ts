import type { ModuleKey } from "../types/permissions";
import type { UserRole } from "../types/user";

export type SidebarLink = {
  href: "/dashboard" | "/users" | "/supplies" | "/feedback";
  label: "Dashboard" | "Users" | "Supplies" | "Feedback";
};

export const permissions: Record<UserRole, ModuleKey[]> = {
  ADMIN: ["supplies", "feedback", "dashboard"],
  SUPERVISOR: ["supplies", "feedback"],
  EMPLOYEE: ["supplies"],
  VIEWER: [],
};

export function canAccess(role: UserRole, page: ModuleKey) {
  return permissions[role]?.includes(page) ?? false;
}

const SIDEBAR_LINKS_BY_ROLE: Record<UserRole, SidebarLink[]> = {
  ADMIN: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/users", label: "Users" },
    { href: "/supplies", label: "Supplies" },
    { href: "/feedback", label: "Feedback" },
  ],
  SUPERVISOR: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/supplies", label: "Supplies" },
    { href: "/feedback", label: "Feedback" },
  ],
  EMPLOYEE: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/supplies", label: "Supplies" },
  ],
  VIEWER: [{ href: "/dashboard", label: "Dashboard" }],
};

export function getSidebarLinks(role: UserRole): SidebarLink[] {
  return SIDEBAR_LINKS_BY_ROLE[role] ?? SIDEBAR_LINKS_BY_ROLE.VIEWER;
}
