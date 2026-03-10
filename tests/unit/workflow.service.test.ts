import { createWorkflowService } from "../../src/modules/workflow/workflow.service";

describe("Workflow service", () => {
  function createDeps() {
    return {
      workflowInstance: {
        create: vi.fn(),
        update: vi.fn(),
      },
    };
  }

  it("creates workflow instance for supervisor", async () => {
    const deps = createDeps();
    const service = createWorkflowService(deps as never);

    deps.workflowInstance.create.mockResolvedValue({
      id: "wf-1",
      entityId: "sr-1",
      currentStep: "REQUESTED",
      status: "PENDING",
      definitionName: "Supply Approval",
      updatedAt: new Date("2026-03-10T00:00:00.000Z"),
    });

    const result = await service.createInstance({
      actorId: "u-1",
      actorRole: "SUPERVISOR",
      entityId: "sr-1",
      definition: {
        name: "Supply Approval",
        version: 1,
        steps: ["REQUESTED", "REVIEWED", "FULFILLED"],
      },
    });

    expect(result.currentStep).toBe("REQUESTED");
    expect(deps.workflowInstance.create).toHaveBeenCalled();
  });

  it("blocks workflow creation for viewer", async () => {
    const deps = createDeps();
    const service = createWorkflowService(deps as never);

    await expect(
      service.createInstance({
        actorId: "u-viewer",
        actorRole: "VIEWER",
        entityId: "sr-1",
        definition: {
          name: "Supply Approval",
          version: 1,
          steps: ["REQUESTED"],
        },
      }),
    ).rejects.toThrow("Only admins and supervisors can manage workflows.");
  });
});
