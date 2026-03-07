import { createSuppliesService } from "../../src/modules/supplies/supplies.service";
import type {
  ApproveRequestInput,
  CreateSupplyRequestInput,
  ListSupplyRequestsInput,
  RejectRequestInput,
} from "../../src/modules/supplies/supplies.types";

function createPrismaMock() {
  return {
    supplyRequest: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("Supplies service", () => {
  it("creates a supply request as employee", async () => {
    const prisma = createPrismaMock();
    const service = createSuppliesService(prisma as never);

    const input: CreateSupplyRequestInput = {
      actorRole: "EMPLOYEE",
      department: "Operations",
      item: "Gloves",
      quantity: 10,
      requesterId: "u1",
    };

    prisma.supplyRequest.create.mockResolvedValue({
      id: "r1",
      item: input.item,
      quantity: input.quantity,
      department: input.department,
      status: "PENDING",
      requestDate: new Date("2026-03-07T00:00:00.000Z"),
      requesterId: input.requesterId,
    });

    const result = await service.createSupplyRequest(input);

    expect(prisma.supplyRequest.create).toHaveBeenCalledWith({
      data: {
        department: input.department,
        item: input.item,
        quantity: input.quantity,
        requesterId: input.requesterId,
        status: "PENDING",
      },
      select: {
        department: true,
        id: true,
        item: true,
        quantity: true,
        requestDate: true,
        requesterId: true,
        status: true,
      },
    });
    expect(result.status).toBe("PENDING");
  });

  it("blocks supply request creation for supervisor", async () => {
    const prisma = createPrismaMock();
    const service = createSuppliesService(prisma as never);

    const input: CreateSupplyRequestInput = {
      actorRole: "SUPERVISOR",
      department: "Operations",
      item: "Gloves",
      quantity: 10,
      requesterId: "u2",
    };

    await expect(service.createSupplyRequest(input)).rejects.toThrow(
      "Only employees or admins can create supply requests.",
    );
    expect(prisma.supplyRequest.create).not.toHaveBeenCalled();
  });

  it("lists own requests for employees", async () => {
    const prisma = createPrismaMock();
    const service = createSuppliesService(prisma as never);

    const input: ListSupplyRequestsInput = {
      actorRole: "EMPLOYEE",
      requesterId: "u1",
    };

    prisma.supplyRequest.findMany.mockResolvedValue([]);

    await service.listSupplyRequests(input);

    expect(prisma.supplyRequest.findMany).toHaveBeenCalledWith({
      orderBy: {
        requestDate: "desc",
      },
      select: {
        department: true,
        id: true,
        item: true,
        quantity: true,
        requestDate: true,
        requesterId: true,
        status: true,
      },
      where: {
        requesterId: input.requesterId,
      },
    });
  });

  it("lists department requests for supervisors", async () => {
    const prisma = createPrismaMock();
    const service = createSuppliesService(prisma as never);

    const input: ListSupplyRequestsInput = {
      actorRole: "SUPERVISOR",
      department: "Operations",
    };

    prisma.supplyRequest.findMany.mockResolvedValue([]);

    await service.listSupplyRequests(input);

    expect(prisma.supplyRequest.findMany).toHaveBeenCalledWith({
      orderBy: {
        requestDate: "desc",
      },
      select: {
        department: true,
        id: true,
        item: true,
        quantity: true,
        requestDate: true,
        requesterId: true,
        status: true,
      },
      where: {
        department: input.department,
      },
    });
  });

  it("lists all requests for admin", async () => {
    const prisma = createPrismaMock();
    const service = createSuppliesService(prisma as never);

    const input: ListSupplyRequestsInput = {
      actorRole: "ADMIN",
    };

    prisma.supplyRequest.findMany.mockResolvedValue([]);

    await service.listSupplyRequests(input);

    expect(prisma.supplyRequest.findMany).toHaveBeenCalledWith({
      orderBy: {
        requestDate: "desc",
      },
      select: {
        department: true,
        id: true,
        item: true,
        quantity: true,
        requestDate: true,
        requesterId: true,
        status: true,
      },
      where: {},
    });
  });

  it("blocks approval from employees", async () => {
    const prisma = createPrismaMock();
    const service = createSuppliesService(prisma as never);

    const input: ApproveRequestInput = {
      actorRole: "EMPLOYEE",
      requestId: "r1",
    };

    await expect(service.approveRequest(input)).rejects.toThrow(
      "Only supervisors or admins can review supply requests.",
    );
    expect(prisma.supplyRequest.update).not.toHaveBeenCalled();
  });

  it("approves request as supervisor", async () => {
    const prisma = createPrismaMock();
    const service = createSuppliesService(prisma as never);

    const input: ApproveRequestInput = {
      actorRole: "SUPERVISOR",
      requestId: "r1",
    };

    prisma.supplyRequest.update.mockResolvedValue({
      id: input.requestId,
      item: "Gloves",
      quantity: 10,
      department: "Operations",
      status: "APPROVED",
      requestDate: new Date("2026-03-07T00:00:00.000Z"),
      requesterId: "u1",
    });

    const result = await service.approveRequest(input);

    expect(prisma.supplyRequest.update).toHaveBeenCalledWith({
      data: {
        status: "APPROVED",
      },
      select: {
        department: true,
        id: true,
        item: true,
        quantity: true,
        requestDate: true,
        requesterId: true,
        status: true,
      },
      where: {
        id: input.requestId,
      },
    });
    expect(result.status).toBe("APPROVED");
  });

  it("rejects request as admin", async () => {
    const prisma = createPrismaMock();
    const service = createSuppliesService(prisma as never);

    const input: RejectRequestInput = {
      actorRole: "ADMIN",
      requestId: "r1",
    };

    prisma.supplyRequest.update.mockResolvedValue({
      id: input.requestId,
      item: "Gloves",
      quantity: 10,
      department: "Operations",
      status: "REJECTED",
      requestDate: new Date("2026-03-07T00:00:00.000Z"),
      requesterId: "u1",
    });

    const result = await service.rejectRequest(input);

    expect(prisma.supplyRequest.update).toHaveBeenCalledWith({
      data: {
        status: "REJECTED",
      },
      select: {
        department: true,
        id: true,
        item: true,
        quantity: true,
        requestDate: true,
        requesterId: true,
        status: true,
      },
      where: {
        id: input.requestId,
      },
    });
    expect(result.status).toBe("REJECTED");
  });
});
