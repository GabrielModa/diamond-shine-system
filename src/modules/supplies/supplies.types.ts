import type { UserRole } from "../../types/user";

export type CreateSupplyRequestInput = {
  actorId: string;
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
