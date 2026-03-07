import type { ModuleKey, Role } from "../types/permissions";

export const permissions: Record<Role, ModuleKey[]> = {
  ADMIN: ["supplies", "feedback", "dashboard"],
  SUPERVISOR: ["supplies", "feedback"],
  EMPLOYEE: ["supplies"],
  VIEWER: [],
};

export function canAccess(role: Role, page: ModuleKey) {
  return permissions[role]?.includes(page) ?? false;
}
