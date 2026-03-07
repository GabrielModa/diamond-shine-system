import type { ModuleKey } from "../types/permissions";
import type { UserRole } from "../types/user";

export const permissions: Record<UserRole, ModuleKey[]> = {
  ADMIN: ["supplies", "feedback", "dashboard"],
  SUPERVISOR: ["supplies", "feedback"],
  EMPLOYEE: ["supplies"],
  VIEWER: [],
};

export function canAccess(role: UserRole, page: ModuleKey) {
  return permissions[role]?.includes(page) ?? false;
}
