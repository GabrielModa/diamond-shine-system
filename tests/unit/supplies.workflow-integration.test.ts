import { createSuppliesService } from "../../src/modules/supplies/supplies.service";

describe("Supplies workflow integration", () => {
  function createDeps() {
    return {
      activity: { create: vi.fn() },
      auditLog: { create: vi.fn() },
      notification: { create: vi.fn() },
      supplyRequest: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
      workflow: { create: vi.fn(), updateMany: vi.fn() },
    };
  }

  it("creates workflow/activity/notification on supply creation", async () => {
    const deps = createDeps();
    const service = createSuppliesService(deps as never);

    deps.supplyRequest.create.mockResolvedValue({
      department: "Ops",
      id: "s1",
      item: "Gloves",
      quantity: 10,
      requestDate: new Date(),
      requesterId: "u1",
      status: "PENDING",
    });

    await service.createSupplyRequest({
      actorId: "u1",
      actorRole: "EMPLOYEE",
      department: "Ops",
      item: "Gloves",
      quantity: 10,
      requesterId: "u1",
    });

    expect(deps.workflow.create).toHaveBeenCalled();
    expect(deps.activity.create).toHaveBeenCalled();
    expect(deps.notification.create).toHaveBeenCalled();
  });

  it("transitions workflow and notifies on approval", async () => {
    const deps = createDeps();
    const service = createSuppliesService(deps as never);

    deps.supplyRequest.update.mockResolvedValue({
      department: "Ops",
      id: "s1",
      item: "Gloves",
      quantity: 10,
      requestDate: new Date(),
      requesterId: "u1",
      status: "APPROVED",
    });

    await service.approveRequest({ actorId: "u2", actorRole: "SUPERVISOR", requestId: "s1" });

    expect(deps.workflow.updateMany).toHaveBeenCalledWith({
      data: { currentStep: "APPROVED", status: "IN_PROGRESS" },
      where: { entityId: "s1" },
    });
    expect(deps.notification.create).toHaveBeenCalled();
  });
});
