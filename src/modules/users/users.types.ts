import type { UserRole } from "../../types/user";

export type CreateUserInput = {
  email: string;
  provider?: "LOCAL" | "GOOGLE";
  role?: UserRole;
};

export type UpdateUserRoleInput = {
  actorRole: UserRole;
  role: UserRole;
  userId: string;
};

export type DeactivateUserInput = {
  actorRole: UserRole;
  userId: string;
};
