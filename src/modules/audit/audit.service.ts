import type { CreateAuditLogInput, ListAuditLogsInput } from "./audit.types";

type AuditLogDelegate = {
  create: (args: {
    data: {
      actorId: string;
      action: string;
      entity: string;
      entityId: string;
      metadata?: unknown;
    };
  }) => Promise<unknown>;
  findMany?: (args: {
    orderBy: {
      createdAt: "desc";
    };
  }) => Promise<Array<{
    action: string;
    actorId: string;
    createdAt: Date;
    entity: string;
    entityId: string;
    id: string;
    metadata: unknown;
  }>>;
};

type AuditServiceDeps = {
  auditLog: AuditLogDelegate;
};

export function createAuditService(deps: AuditServiceDeps) {
  return {
    async createAuditLog(input: CreateAuditLogInput): Promise<void> {
      await deps.auditLog.create({
        data: {
          action: input.action,
          actorId: input.actorId,
          entity: input.entity,
          entityId: input.entityId,
          metadata: input.metadata,
        },
      });
    },

    async listAuditLogs(input: ListAuditLogsInput) {
      if (input.actorRole !== "ADMIN") {
        throw new Error("Only admins can view audit logs.");
      }

      if (!deps.auditLog.findMany) {
        throw new Error("Audit log listing is not configured.");
      }

      return deps.auditLog.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });
    },
  };
}

export function createAuditServiceFromPrisma(prisma: AuditServiceDeps) {
  return createAuditService(prisma);
}
