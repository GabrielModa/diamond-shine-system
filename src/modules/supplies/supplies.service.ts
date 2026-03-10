import type { Supply, SupplyStatus } from "../../types/supply";
import type { UserRole } from "../../types/user";
import { createAuditService } from "../audit/audit.service";
import type {
  ApproveRequestInput,
  CompleteRequestInput,
  CreateSupplyRequestInput,
  ListSupplyRequestsInput,
  RejectRequestInput,
} from "./supplies.types";

type SupplyRecord = {
  id: string;
  item: string;
  quantity: number;
  department: string;
  status: SupplyStatus;
  requestDate: Date;
  requesterId: string;
};

type SupplyRequestDelegate = {
  create: (args: {
    data: {
      item: string;
      quantity: number;
      department: string;
      status: "PENDING";
      requesterId: string;
    };
    select: {
      id: true;
      item: true;
      quantity: true;
      department: true;
      status: true;
      requestDate: true;
      requesterId: true;
    };
  }) => Promise<SupplyRecord>;
  findMany: (args: {
    where: {
      requesterId?: string;
      department?: string;
    };
    select: {
      id: true;
      item: true;
      quantity: true;
      department: true;
      status: true;
      requestDate: true;
      requesterId: true;
    };
    orderBy: {
      requestDate: "desc";
    };
  }) => Promise<SupplyRecord[]>;
  update: (args: {
    where: {
      id: string;
    };
    data: {
      status: "APPROVED" | "REJECTED" | "COMPLETED";
    };
    select: {
      id: true;
      item: true;
      quantity: true;
      department: true;
      status: true;
      requestDate: true;
      requesterId: true;
    };
  }) => Promise<SupplyRecord>;
};

type SuppliesServiceDeps = {
  auditLog: {
    create: (args: {
      data: {
        actorId: string;
        action: string;
        entity: string;
        entityId: string;
        metadata?: unknown;
      };
    }) => Promise<unknown>;
  };
  supplyRequest: SupplyRequestDelegate;
};

const supplySelect = {
  department: true,
  id: true,
  item: true,
  quantity: true,
  requestDate: true,
  requesterId: true,
  status: true,
} as const;

function toSupply(record: SupplyRecord): Supply {
  return {
    department: record.department,
    id: record.id,
    item: record.item,
    quantity: record.quantity,
    requestDate: record.requestDate,
    requesterId: record.requesterId,
    status: record.status,
  };
}

function assertCanCreate(actorRole: UserRole): void {
  if (actorRole !== "EMPLOYEE" && actorRole !== "ADMIN") {
    throw new Error("Only employees or admins can create supply requests.");
  }
}

function assertCanReview(actorRole: UserRole): void {
  if (actorRole !== "SUPERVISOR" && actorRole !== "ADMIN") {
    throw new Error("Only supervisors or admins can review supply requests.");
  }
}

function buildListWhere(input: ListSupplyRequestsInput): {
  requesterId?: string;
  department?: string;
} {
  if (input.actorRole === "ADMIN") {
    return {};
  }

  if (input.actorRole === "SUPERVISOR") {
    if (!input.department) {
      throw new Error("Supervisors must provide a department.");
    }
    return {
      department: input.department,
    };
  }

  if (input.actorRole === "EMPLOYEE") {
    if (!input.requesterId) {
      throw new Error("Employees must provide a requester id.");
    }
    return {
      requesterId: input.requesterId,
    };
  }

  throw new Error("Viewers cannot list supply requests.");
}

export function createSuppliesService(
  deps: SuppliesServiceDeps,
) {
  const auditService = createAuditService({
    auditLog: deps.auditLog,
  });

  return {
    async createSupplyRequest(input: CreateSupplyRequestInput): Promise<Supply> {
      assertCanCreate(input.actorRole);

      const created = await deps.supplyRequest.create({
        data: {
          department: input.department,
          item: input.item,
          quantity: input.quantity,
          requesterId: input.requesterId,
          status: "PENDING",
        },
        select: supplySelect,
      });

      await auditService.createAuditLog({
        action: "SUPPLY_REQUEST_CREATED",
        actorId: input.actorId,
        entity: "SupplyRequest",
        entityId: created.id,
        metadata: {
          department: created.department,
          quantity: created.quantity,
        },
      });

      return toSupply(created);
    },

    async listSupplyRequests(input: ListSupplyRequestsInput): Promise<Supply[]> {
      const requests = await deps.supplyRequest.findMany({
        orderBy: {
          requestDate: "desc",
        },
        select: supplySelect,
        where: buildListWhere(input),
      });

      return requests.map(toSupply);
    },

    async approveRequest(input: ApproveRequestInput): Promise<Supply> {
      assertCanReview(input.actorRole);

      const updated = await deps.supplyRequest.update({
        data: {
          status: "APPROVED",
        },
        select: supplySelect,
        where: {
          id: input.requestId,
        },
      });

      await auditService.createAuditLog({
        action: "SUPPLY_APPROVED",
        actorId: input.actorId,
        entity: "SupplyRequest",
        entityId: input.requestId,
      });

      return toSupply(updated);
    },

    async rejectRequest(input: RejectRequestInput): Promise<Supply> {
      assertCanReview(input.actorRole);

      const updated = await deps.supplyRequest.update({
        data: {
          status: "REJECTED",
        },
        select: supplySelect,
        where: {
          id: input.requestId,
        },
      });

      await auditService.createAuditLog({
        action: "SUPPLY_REJECTED",
        actorId: input.actorId,
        entity: "SupplyRequest",
        entityId: input.requestId,
      });

      return toSupply(updated);
    },

    async completeRequest(input: CompleteRequestInput): Promise<Supply> {
      assertCanReview(input.actorRole);

      const updated = await deps.supplyRequest.update({
        data: {
          status: "COMPLETED",
        },
        select: supplySelect,
        where: {
          id: input.requestId,
        },
      });

      await auditService.createAuditLog({
        action: "SUPPLY_COMPLETED",
        actorId: input.actorId,
        entity: "SupplyRequest",
        entityId: input.requestId,
      });

      return toSupply(updated);
    },
  };
}

export function createSuppliesServiceFromPrisma(prisma: SuppliesServiceDeps) {
  return createSuppliesService(prisma);
}
