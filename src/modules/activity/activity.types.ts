import type { UserRole } from "../../types/user";

export type RecordActivityInput = {
  actorId: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  metadata?: unknown;
};

export type ListActivityFeedInput = {
  actorId: string;
  actorRole: UserRole;
};

export type ActivityEntry = {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: unknown;
  createdAt: Date;
};
