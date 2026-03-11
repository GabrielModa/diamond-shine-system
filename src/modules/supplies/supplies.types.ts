import type { SupplyPriority, SupplyStatus } from "../../types/supply";
import type { UserRole } from "../../types/user";

export type CreateSupplyRequestInput = {
  actorId: string;
  actorRole: UserRole;
  item: string;
  quantity: number;
  department: string;
  requesterId: string;
  priority: SupplyPriority;
  notes?: string;
};

export type ListSupplyRequestsInput = {
  actorRole: UserRole;
  requesterId?: string;
  department?: string;
  status?: "all" | "pending" | "email" | "completed";
  period?: "today" | "week" | "month" | "all";
  search?: string;
};

export type ApproveRequestInput = {
  actorId: string;
  actorRole: UserRole;
  requestId: string;
};

export type RejectRequestInput = {
  actorId: string;
  actorRole: UserRole;
  requestId: string;
};

export type CompleteRequestInput = {
  actorId: string;
  actorRole: UserRole;
  requestId: string;
};

export type NotifyClientInput = {
  actorId: string;
  actorRole: UserRole;
  requestId: string;
  clientEmail: string;
};

export type SupplyListResult = {
  list: Array<{ id: string }>;
  total: number;
};

export const STATUS_MAP: Record<NonNullable<ListSupplyRequestsInput["status"]>, SupplyStatus | undefined> = {
  all: undefined,
  completed: "COMPLETED",
  email: "EMAIL_SENT",
  pending: "PENDING",
};
