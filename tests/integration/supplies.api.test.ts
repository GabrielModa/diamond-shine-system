import { NextRequest } from "next/server";

const { createSuppliesServiceFromPrismaMock, getActiveSessionUserMock, prismaMock, suppliesServiceMock } = vi.hoisted(() => {
  const suppliesService = {
    approveRequest: vi.fn(),
    completeRequest: vi.fn(),
    createSupplyRequest: vi.fn(),
    listSupplyRequests: vi.fn(),
    notifyClient: vi.fn(),
    rejectRequest: vi.fn(),
  };

  return {
    createSuppliesServiceFromPrismaMock: vi.fn(() => suppliesService),
    getActiveSessionUserMock: vi.fn(),
    prismaMock: { activity: {}, auditLog: {}, notification: {}, supplyRequest: {}, workflowInstance: {} },
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
    getActiveSessionUserMock.mockResolvedValue({ email: "employee@x.com", id: "u1", role: "EMPLOYEE" });
  });

  it("POST /api/supplies creates a request", async () => {
    suppliesServiceMock.createSupplyRequest.mockResolvedValue({ id: "r1" });
    const request = new NextRequest("http://localhost/api/supplies", { body: JSON.stringify({ department: "Operations", item: "Gloves", priority: "NORMAL", quantity: 10 }), headers: { "content-type": "application/json" }, method: "POST" });
    const response = await POST(request);
    expect(createSuppliesServiceFromPrismaMock).toHaveBeenCalled();
    expect(response.status).toBe(201);
  });

  it("GET /api/supplies lists requests and total", async () => {
    suppliesServiceMock.listSupplyRequests.mockResolvedValue({ list: [], total: 0 });
    const response = await GET(new NextRequest("http://localhost/api/supplies?status=all&period=all", { method: "GET" }));
    expect(response.status).toBe(200);
  });

  it("PATCH /api/supplies approve action", async () => {
    getActiveSessionUserMock.mockResolvedValue({ email: "supervisor@x.com", id: "u2", role: "SUPERVISOR" });
    suppliesServiceMock.approveRequest.mockResolvedValue({ id: "r1", status: "APPROVED" });
    const response = await PATCH(new NextRequest("http://localhost/api/supplies", { body: JSON.stringify({ action: "approve", requestId: "r1" }), headers: { "content-type": "application/json" }, method: "PATCH" }));
    expect(response.status).toBe(200);
  });
});
