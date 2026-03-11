import type { Supply, SupplyPriority, SupplyStatus } from "../../types/supply";
import type { UserRole } from "../../types/user";
import { sendClientNotification, sendSupplyEmail } from "../../lib/email";
import { createAuditService } from "../audit/audit.service";
import type {
  ApproveRequestInput,
  CompleteRequestInput,
  CreateSupplyRequestInput,
  ListSupplyRequestsInput,
  NotifyClientInput,
  RejectRequestInput,
} from "./supplies.types";

type SupplyRecord = {
  id: string;
  item: string;
  quantity: number;
  department: string;
  status: SupplyStatus;
  priority: SupplyPriority;
  notes: string | null;
  emailSentAt: Date | null;
  requestDate: Date;
  requesterId: string;
};

type SuppliesServiceDeps = {
  auditLog: { create: (args: { data: { actorId: string; action: string; entity: string; entityId: string; metadata?: unknown } }) => Promise<unknown> };
  supplyRequest: {
    create: (args: { data: { item: string; quantity: number; department: string; status: "PENDING"; requesterId: string; priority: SupplyPriority; notes?: string }; select: typeof supplySelect }) => Promise<SupplyRecord>;
    findMany: (args: { where: Record<string, unknown>; select: typeof supplySelect; orderBy: { requestDate: "desc" } }) => Promise<SupplyRecord[]>;
    count: (args: { where: Record<string, unknown> }) => Promise<number>;
    update: (args: { where: { id: string }; data: Record<string, unknown>; select: typeof supplySelect }) => Promise<SupplyRecord>;
    findUnique: (args: { where: { id: string }; select: typeof supplySelect }) => Promise<SupplyRecord | null>;
  };
  workflow?: { create: (args: { data: { entityId: string; currentStep: string; definitionName: string; definitionVersion: number; status: "PENDING" } }) => Promise<unknown>; updateMany: (args: { where: { entityId: string }; data: { currentStep: string; status: "IN_PROGRESS" | "COMPLETED" | "REJECTED" } }) => Promise<unknown> };
  activity?: { create: (args: { data: { actorId: string; action: string; entity: string; entityId: string; metadata?: unknown } }) => Promise<unknown> };
  notification?: { create: (args: { data: { recipientId: string; title: string; message: string; channel: "IN_APP"; status: "QUEUED" } }) => Promise<unknown> };
};

const supplySelect = {
  department: true,
  emailSentAt: true,
  id: true,
  item: true,
  notes: true,
  priority: true,
  quantity: true,
  requestDate: true,
  requesterId: true,
  status: true,
} as const;

function toSupply(record: SupplyRecord): Supply {
  return { ...record };
}

function assertCanCreate(actorRole: UserRole): void {
  if (actorRole !== "EMPLOYEE" && actorRole !== "ADMIN") throw new Error("Only employees or admins can create supply requests.");
}

function assertCanReview(actorRole: UserRole): void {
  if (actorRole !== "SUPERVISOR" && actorRole !== "ADMIN") throw new Error("Only supervisors or admins can review supply requests.");
}

function assertCanComplete(actorRole: UserRole): void {
  if (actorRole !== "ADMIN") throw new Error("Only admins can complete supply requests.");
}

function buildListWhere(input: ListSupplyRequestsInput): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (input.actorRole === "SUPERVISOR") {
    if (!input.department) throw new Error("Supervisors must provide a department.");
    where.department = input.department;
  }
  if (input.actorRole === "EMPLOYEE") {
    if (!input.requesterId) throw new Error("Employees must provide a requester id.");
    where.requesterId = input.requesterId;
  }
  if (input.actorRole === "VIEWER") throw new Error("Viewers cannot list supply requests.");

  if (input.status === "pending") where.status = "PENDING";
  if (input.status === "email") where.status = "EMAIL_SENT";
  if (input.status === "completed") where.status = "COMPLETED";

  if (input.period && input.period !== "all") {
    const now = new Date();
    const start = new Date(now);
    if (input.period === "today") start.setHours(0, 0, 0, 0);
    if (input.period === "week") start.setDate(now.getDate() - 7);
    if (input.period === "month") start.setMonth(now.getMonth() - 1);
    where.requestDate = { gte: start };
  }

  if (input.search) {
    where.OR = [
      { item: { contains: input.search, mode: "insensitive" } },
      { department: { contains: input.search, mode: "insensitive" } },
      { notes: { contains: input.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export function createSuppliesService(deps: SuppliesServiceDeps) {
  const auditService = createAuditService({ auditLog: deps.auditLog });

  return {
    async createSupplyRequest(input: CreateSupplyRequestInput): Promise<Supply> {
      assertCanCreate(input.actorRole);
      const created = await deps.supplyRequest.create({
        data: { department: input.department, item: input.item, notes: input.notes, priority: input.priority, quantity: input.quantity, requesterId: input.requesterId, status: "PENDING" },
        select: supplySelect,
      });

      await Promise.all([
        auditService.createAuditLog({ action: "SUPPLY_REQUEST_CREATED", actorId: input.actorId, entity: "SupplyRequest", entityId: created.id, metadata: { priority: created.priority, quantity: created.quantity } }),
        deps.workflow?.create({ data: { currentStep: "REQUESTED", definitionName: "SupplyRequestFlow", definitionVersion: 1, entityId: created.id, status: "PENDING" } }),
        deps.activity?.create({ data: { action: "SUPPLY_REQUEST_CREATED", actorId: input.actorId, entity: "SupplyRequest", entityId: created.id } }),
        deps.notification?.create({ data: { channel: "IN_APP", message: `Supply request ${created.item} is pending review.`, recipientId: created.requesterId, status: "QUEUED", title: "Supply request created" } }),
        sendSupplyEmail(created),
      ]);

      return toSupply(created);
    },

    async listSupplyRequests(input: ListSupplyRequestsInput): Promise<{ list: Supply[]; total: number }> {
      const where = buildListWhere(input);
      const [requests, total] = await Promise.all([
        deps.supplyRequest.findMany({ orderBy: { requestDate: "desc" }, select: supplySelect, where }),
        deps.supplyRequest.count({ where }),
      ]);
      return { list: requests.map(toSupply), total };
    },

    async approveRequest(input: ApproveRequestInput): Promise<Supply> {
      assertCanReview(input.actorRole);
      const updated = await deps.supplyRequest.update({ where: { id: input.requestId }, data: { status: "APPROVED" }, select: supplySelect });
      await Promise.all([
        auditService.createAuditLog({ action: "SUPPLY_APPROVED", actorId: input.actorId, entity: "SupplyRequest", entityId: input.requestId }),
        deps.workflow?.updateMany({ where: { entityId: input.requestId }, data: { currentStep: "APPROVED", status: "IN_PROGRESS" } }),
        deps.activity?.create({ data: { action: "SUPPLY_APPROVED", actorId: input.actorId, entity: "SupplyRequest", entityId: input.requestId } }),
      ]);
      return toSupply(updated);
    },

    async rejectRequest(input: RejectRequestInput): Promise<Supply> {
      assertCanReview(input.actorRole);
      const updated = await deps.supplyRequest.update({ where: { id: input.requestId }, data: { status: "REJECTED" }, select: supplySelect });
      await deps.activity?.create({ data: { action: "SUPPLY_REJECTED", actorId: input.actorId, entity: "SupplyRequest", entityId: input.requestId } });
      return toSupply(updated);
    },

    async completeRequest(input: CompleteRequestInput): Promise<Supply> {
      assertCanComplete(input.actorRole);
      const updated = await deps.supplyRequest.update({ where: { id: input.requestId }, data: { status: "COMPLETED" }, select: supplySelect });
      await deps.activity?.create({ data: { action: "SUPPLY_COMPLETED", actorId: input.actorId, entity: "SupplyRequest", entityId: input.requestId } });
      return toSupply(updated);
    },

    async notifyClient(input: NotifyClientInput): Promise<Supply> {
      assertCanReview(input.actorRole);
      const request = await deps.supplyRequest.findUnique({ where: { id: input.requestId }, select: supplySelect });
      if (!request) throw new Error("Supply request not found.");
      await sendClientNotification(request, input.clientEmail);
      const updated = await deps.supplyRequest.update({ where: { id: input.requestId }, data: { emailSentAt: new Date(), status: "EMAIL_SENT" }, select: supplySelect });
      await deps.activity?.create({ data: { action: "SUPPLY_CLIENT_NOTIFIED", actorId: input.actorId, entity: "SupplyRequest", entityId: input.requestId, metadata: { clientEmail: input.clientEmail } } });
      return toSupply(updated);
    },
  };
}

export function createSuppliesServiceFromPrisma(prisma: SuppliesServiceDeps) {
  return createSuppliesService(prisma);
}
