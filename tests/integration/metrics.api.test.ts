const { getServerSessionMock, prismaMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  prismaMock: {
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
  },
}));

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

import { GET } from "../../src/app/api/metrics/route";

describe("Metrics API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns metrics for admin users", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "u-admin",
        role: "ADMIN",
      },
    });
    prismaMock.user.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);
    prismaMock.supplyRequest.count.mockResolvedValueOnce(3).mockResolvedValueOnce(5).mockResolvedValueOnce(1);
    prismaMock.feedback.aggregate.mockResolvedValue({
      _avg: { score: 7.5 },
      _count: { _all: 4 },
    });
    prismaMock.supplyRequest.findMany.mockResolvedValue([
      { department: "Ops" },
      { department: "Ops" },
      { department: "Sales" },
    ]);
    prismaMock.feedback.findMany.mockResolvedValue([
      { date: new Date("2026-03-08T10:00:00.000Z"), score: 8 },
      { date: new Date("2026-03-08T12:00:00.000Z"), score: 6 },
      { date: new Date("2026-03-09T12:00:00.000Z"), score: 9 },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      activeUsers: 8,
      averageFeedbackScore: 7.5,
      pendingSupplies: 3,
      totalFeedback: 4,
      totalUsers: 10,
    });
  });

  it("returns 403 for employee users", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "u-employee",
        role: "EMPLOYEE",
      },
    });

    const response = await GET();

    expect(response.status).toBe(403);
  });
});
