import type { UserRole } from "../../types/user";

export type CreateUserInput = {
  actorId: string;
  email: string;
  provider?: "LOCAL" | "GOOGLE";
  role?: UserRole;
};

export type UpdateUserRoleInput = {
  actorId: string;
  actorRole: UserRole;
  role: UserRole;
  userId: string;
};

export type DeactivateUserInput = {
  actorId: string;
  actorRole: UserRole;
  userId: string;
};

export type ActivateUserInput = {
  actorId: string;
  actorRole: UserRole;
  userId: string;
};
