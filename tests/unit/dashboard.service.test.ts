import { createDashboardService } from "../../src/modules/dashboard/dashboard.service";

function createDeps() {
  return {
    feedback: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    supplyRequest: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      count: vi.fn(),
    },
  };
}

describe("Dashboard service", () => {
  it("computes metrics for admins", async () => {
    const deps = createDeps();
    const service = createDashboardService(deps as never);

    deps.user.count.mockResolvedValueOnce(12).mockResolvedValueOnce(9);
    deps.supplyRequest.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1);
    deps.feedback.aggregate.mockResolvedValue({
      _avg: { score: 7.5 },
      _count: { _all: 4 },
    });
    deps.supplyRequest.findMany.mockResolvedValue([
      { department: "Ops" },
      { department: "Ops" },
      { department: "Sales" },
    ]);
    deps.feedback.findMany.mockResolvedValue([
      { date: new Date("2026-03-08T10:00:00.000Z"), score: 8 },
      { date: new Date("2026-03-08T12:00:00.000Z"), score: 6 },
      { date: new Date("2026-03-09T12:00:00.000Z"), score: 9 },
    ]);

    const result = await service.getMetrics("ADMIN");

    expect(result.totalUsers).toBe(12);
    expect(result.activeUsers).toBe(9);
    expect(result.pendingSupplies).toBe(2);
    expect(result.approvedSupplies).toBe(4);
    expect(result.rejectedSupplies).toBe(1);
    expect(result.totalFeedback).toBe(4);
    expect(result.averageFeedbackScore).toBe(7.5);
    expect(result.suppliesByDepartment).toEqual([
      { department: "Ops", count: 2 },
      { department: "Sales", count: 1 },
    ]);
    expect(result.feedbackScoreTrend).toEqual([
      { date: "2026-03-08", averageScore: 7 },
      { date: "2026-03-09", averageScore: 9 },
    ]);
  });

  it("blocks metrics for employees", async () => {
    const deps = createDeps();
    const service = createDashboardService(deps as never);

    await expect(service.getMetrics("EMPLOYEE")).rejects.toThrow(
      "Only admins and supervisors can view dashboard metrics.",
    );
  });
});
