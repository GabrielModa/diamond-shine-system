import { createJobsService } from "../../src/modules/jobs/jobs.service";

describe("Jobs service", () => {
  function createDeps() {
    return {
      job: {
        create: vi.fn(),
        update: vi.fn(),
      },
    };
  }

  it("allows admins to schedule jobs", async () => {
    const deps = createDeps();
    const service = createJobsService(deps as never);

    deps.job.create.mockResolvedValue({
      id: "job-1",
      key: "sync-google-sheets",
      payload: { sheet: "ops" },
      runAt: new Date(),
      status: "SCHEDULED",
    });

    const result = await service.scheduleJob({
      actorId: "u-admin",
      actorRole: "ADMIN",
      key: "sync-google-sheets",
      payload: { sheet: "ops" },
      runAt: new Date(),
    });

    expect(result.key).toBe("sync-google-sheets");
  });

  it("blocks non-admin scheduling", async () => {
    const service = createJobsService(createDeps() as never);

    await expect(
      service.scheduleJob({
        actorId: "u-supervisor",
        actorRole: "SUPERVISOR",
        key: "sync-google-sheets",
        runAt: new Date(),
      }),
    ).rejects.toThrow("Only admins can schedule background jobs.");
  });
});
