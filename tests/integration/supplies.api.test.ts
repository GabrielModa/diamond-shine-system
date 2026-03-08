import { NextRequest } from "next/server";

const {
  createSuppliesServiceFromPrismaMock,
  getServerSessionMock,
  prismaMock,
  suppliesServiceMock,
} = vi.hoisted(() => {
  const suppliesService = {
    approveRequest: vi.fn(),
    createSupplyRequest: vi.fn(),
    listSupplyRequests: vi.fn(),
    rejectRequest: vi.fn(),
  };

  return {
    createSuppliesServiceFromPrismaMock: vi.fn(() => suppliesService),
    getServerSessionMock: vi.fn(),
    prismaMock: {
      auditLog: {},
      supplyRequest: {},
    },
    suppliesServiceMock: suppliesService,
  };
});

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../../src/modules/supplies/supplies.service", () => ({
  createSuppliesServiceFromPrisma: createSuppliesServiceFromPrismaMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

import { GET, PATCH, POST } from "../../src/app/api/supplies/route";

describe("Supplies API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        email: "employee@example.com",
        id: "u1",
        role: "EMPLOYEE",
      },
    });
  });

  it("POST /api/supplies creates a request", async () => {
    const payload = {
      department: "Operations",
      item: "Gloves",
      quantity: 10,
    };

    suppliesServiceMock.createSupplyRequest.mockResolvedValue({
      department: payload.department,
      id: "r1",
      item: payload.item,
      quantity: payload.quantity,
      requestDate: new Date("2026-03-08T00:00:00.000Z"),
      requesterId: payload.requesterId,
      status: "PENDING",
    });

    const request = new NextRequest("http://localhost/api/supplies", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    const response = await POST(request);

    expect(createSuppliesServiceFromPrismaMock).toHaveBeenCalledWith({
      auditLog: prismaMock.auditLog,
      supplyRequest: prismaMock.supplyRequest,
    });
    expect(suppliesServiceMock.createSupplyRequest).toHaveBeenCalledWith({
      actorId: "u1",
      actorRole: "EMPLOYEE",
      department: payload.department,
      item: payload.item,
      quantity: payload.quantity,
      requesterId: "u1",
    });
    expect(response.status).toBe(201);
  });

  it("GET /api/supplies lists requests using query params", async () => {
    suppliesServiceMock.listSupplyRequests.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/supplies?requesterId=another-user",
      {
        method: "GET",
      },
    );

    const response = await GET(request);

    expect(suppliesServiceMock.listSupplyRequests).toHaveBeenCalledWith({
      actorRole: "EMPLOYEE",
      department: undefined,
      requesterId: "u1",
    });
    expect(response.status).toBe(200);
  });

  it("PATCH /api/supplies rejects a request", async () => {
    const payload = {
      action: "reject",
      requestId: "r1",
    } as const;

    getServerSessionMock.mockResolvedValue({
      user: {
        email: "supervisor@example.com",
        id: "u-supervisor",
        role: "SUPERVISOR",
      },
    });

    suppliesServiceMock.rejectRequest.mockResolvedValue({
      department: "Operations",
      id: "r1",
      item: "Gloves",
      quantity: 10,
      requestDate: new Date("2026-03-08T00:00:00.000Z"),
      requesterId: "u1",
      status: "REJECTED",
    });

    const request = new NextRequest("http://localhost/api/supplies", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });

    const response = await PATCH(request);

    expect(suppliesServiceMock.rejectRequest).toHaveBeenCalledWith({
      actorId: "u-supervisor",
      actorRole: "SUPERVISOR",
      requestId: "r1",
    });
    expect(response.status).toBe(200);
  });

  it("returns 401 when session does not exist", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/supplies", {
        method: "GET",
      }),
    );

    expect(suppliesServiceMock.listSupplyRequests).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
  });
});
