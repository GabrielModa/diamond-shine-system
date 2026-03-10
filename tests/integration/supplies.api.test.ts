import { NextRequest } from "next/server";

const {
  createSuppliesServiceFromPrismaMock,
  getActiveSessionUserMock,
  prismaMock,
  suppliesServiceMock,
} = vi.hoisted(() => {
  const suppliesService = {
    approveRequest: vi.fn(),
    completeRequest: vi.fn(),
    createSupplyRequest: vi.fn(),
    listSupplyRequests: vi.fn(),
    rejectRequest: vi.fn(),
  };

  return {
    createSuppliesServiceFromPrismaMock: vi.fn(() => suppliesService),
    getActiveSessionUserMock: vi.fn(),
    prismaMock: {
      activity: {},
      auditLog: {},
      notification: {},
      supplyRequest: {},
      workflowInstance: {},
    },
    suppliesServiceMock: suppliesService,
  };
});

vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("../../src/modules/supplies/supplies.service", () => ({ createSuppliesServiceFromPrisma: createSuppliesServiceFromPrismaMock }));

import { GET, PATCH, POST } from "../../src/app/api/supplies/route";

describe("Supplies API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "EMPLOYEE" });
  });

  it("POST /api/supplies creates a request", async () => {
    suppliesServiceMock.createSupplyRequest.mockResolvedValue({ id: "r1" });
    const request = new NextRequest("http://localhost/api/supplies", { body: JSON.stringify({ department: "Operations", item: "Gloves", quantity: 10 }), headers: { "content-type": "application/json" }, method: "POST" });
    const response = await POST(request);
    expect(createSuppliesServiceFromPrismaMock).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it("GET /api/supplies lists requests", async () => {
    suppliesServiceMock.listSupplyRequests.mockResolvedValue([]);
    const response = await GET(new NextRequest("http://localhost/api/supplies", { method: "GET" }));
    expect(response.status).toBe(200);
  });
});
