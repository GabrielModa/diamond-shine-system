import { createReportsService } from "../../src/modules/reports/reports.service";

describe("Reports service", () => {
  function createDeps() {
    return {
      report: {
        create: vi.fn(),
      },
    };
  }

  it("generates report request for supervisors", async () => {
    const deps = createDeps();
    const service = createReportsService(deps as never);

    deps.report.create.mockResolvedValue({
      id: "rep-1",
      reportKey: "supplies-by-department",
      format: "CSV",
      requestedBy: "u-2",
      status: "PENDING",
      createdAt: new Date(),
    });

    const result = await service.generateReport({
      actorId: "u-2",
      actorRole: "SUPERVISOR",
      reportKey: "supplies-by-department",
      format: "CSV",
    });

    expect(result.status).toBe("PENDING");
  });

  it("blocks viewers from report generation", async () => {
    const service = createReportsService(createDeps() as never);

    await expect(
      service.generateReport({
        actorId: "u-4",
        actorRole: "VIEWER",
        reportKey: "supplies-by-department",
        format: "CSV",
      }),
    ).rejects.toThrow("Only admins and supervisors can generate reports.");
  });
});
