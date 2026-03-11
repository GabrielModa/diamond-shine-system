import type { AppRoute } from "../types/permissions";
import type { UserRole } from "../types/user";

export type SidebarLink = {
  href: AppRoute;
  label: string;
};

export const permissions: Record<UserRole, AppRoute[]> = {
  ADMIN: ["/dashboard", "/users", "/supplies", "/feedback", "/files", "/reports", "/search", "/settings", "/activity", "/notifications"],
  SUPERVISOR: ["/dashboard", "/supplies", "/feedback", "/files", "/reports", "/search", "/activity", "/notifications"],
  EMPLOYEE: ["/dashboard", "/supplies", "/feedback", "/files", "/search", "/activity", "/notifications"],
  VIEWER: ["/dashboard", "/search", "/activity", "/notifications"],
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
    { href: "/notifications", label: "Notifications" },
    { href: "/files", label: "Files" },
    { href: "/reports", label: "Reports" },
    { href: "/search", label: "Search" },
    { href: "/activity", label: "Activity" },
    { href: "/settings", label: "Settings" },
  ],
  SUPERVISOR: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/supplies", label: "Supplies" },
    { href: "/feedback", label: "Feedback" },
    { href: "/notifications", label: "Notifications" },
    { href: "/files", label: "Files" },
    { href: "/reports", label: "Reports" },
    { href: "/search", label: "Search" },
    { href: "/activity", label: "Activity" },
  ],
  EMPLOYEE: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/supplies", label: "Supplies" },
    { href: "/feedback", label: "Feedback" },
    { href: "/notifications", label: "Notifications" },
    { href: "/files", label: "Files" },
    { href: "/search", label: "Search" },
    { href: "/activity", label: "Activity" },
  ],
  VIEWER: [
    { href: "/dashboard", label: "Dashboard" },
  ],
};

export function getSidebarLinks(role: UserRole): SidebarLink[] {
  return SIDEBAR_LINKS_BY_ROLE[role] ?? SIDEBAR_LINKS_BY_ROLE.VIEWER;
}
