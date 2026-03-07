import type { UserRole } from "../../types/user";

export type CreateSupplyRequestInput = {
  actorRole: UserRole;
  item: string;
  quantity: number;
  department: string;
  requesterId: string;
};

export type ListSupplyRequestsInput = {
  actorRole: UserRole;
  requesterId?: string;
  department?: string;
};

export type ApproveRequestInput = {
  actorRole: UserRole;
  requestId: string;
};

export type RejectRequestInput = {
  actorRole: UserRole;
  requestId: string;
};
