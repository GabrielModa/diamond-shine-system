import type { AppRoute } from "../types/permissions";
import type { UserRole } from "../types/user";

export type SidebarLink = {
  href: AppRoute;
  label: "Dashboard" | "Users" | "Supplies" | "Feedback";
};

export const permissions: Record<UserRole, AppRoute[]> = {
  ADMIN: ["/dashboard", "/users", "/supplies", "/feedback"],
  SUPERVISOR: ["/dashboard", "/supplies", "/feedback"],
  EMPLOYEE: ["/dashboard", "/supplies"],
  VIEWER: ["/dashboard"],
};

export function canAccessRoute(role: UserRole, route: AppRoute) {
  return permissions[role]?.includes(route) ?? false;
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
