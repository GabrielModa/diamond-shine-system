export type CreateAuditLogInput = {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: unknown;
};

export type ListAuditLogsInput = {
  actorRole: "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER";
};
