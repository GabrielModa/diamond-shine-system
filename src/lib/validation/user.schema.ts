import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  provider: z.enum(["LOCAL", "GOOGLE"]).optional(),
  role: z.enum(["ADMIN", "SUPERVISOR", "EMPLOYEE", "VIEWER"]).optional(),
});

export const updateUserRoleSchema = z.object({
  action: z.literal("updateRole"),
  role: z.enum(["ADMIN", "SUPERVISOR", "EMPLOYEE", "VIEWER"]),
  userId: z.string().min(1),
});

export const deactivateUserSchema = z.object({
  action: z.literal("deactivate"),
  userId: z.string().min(1),
});

export const activateUserSchema = z.object({
  action: z.literal("activate"),
  userId: z.string().min(1),
});

export const resetUserPasswordSchema = z.object({
  action: z.literal("resetPassword"),
  userId: z.string().min(1),
});

export const patchUserSchema = z.union([
  updateUserRoleSchema,
  deactivateUserSchema,
  activateUserSchema,
  resetUserPasswordSchema,
]);
