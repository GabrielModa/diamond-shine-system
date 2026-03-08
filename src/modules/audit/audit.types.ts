export type CreateAuditLogInput = {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
};
