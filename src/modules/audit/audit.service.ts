import type { CreateAuditLogInput } from "./audit.types";

type AuditLogDelegate = {
  create: (args: {
    data: {
      actorId: string;
      action: string;
      entity: string;
      entityId: string;
      metadata?: Record<string, unknown>;
    };
  }) => Promise<unknown>;
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
  };
}

export function createAuditServiceFromPrisma(prisma: AuditServiceDeps) {
  return createAuditService(prisma);
}
