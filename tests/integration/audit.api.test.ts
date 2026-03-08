const { getServerSessionMock, prismaMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  prismaMock: {
    auditLog: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

import { GET } from "../../src/app/api/audit/route";

describe("Audit API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns logs for admin users", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "u-admin",
        role: "ADMIN",
      },
    });
    prismaMock.auditLog.findMany.mockResolvedValue([]);

    const response = await GET();

    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
    });
    expect(response.status).toBe(200);
  });

  it("returns 403 for non-admin users", async () => {
    getServerSessionMock.mockResolvedValue({
      user: {
        id: "u-employee",
        role: "EMPLOYEE",
      },
    });

    const response = await GET();

    expect(prismaMock.auditLog.findMany).not.toHaveBeenCalled();
    expect(response.status).toBe(403);
  });
});
