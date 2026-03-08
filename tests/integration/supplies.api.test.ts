import { NextRequest } from "next/server";

const {
  createSuppliesServiceFromPrismaMock,
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
    prismaMock: {
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

import { GET, PATCH, POST } from "../../src/app/api/supplies/route";

describe("Supplies API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POST /api/supplies creates a request", async () => {
    const payload = {
      actorRole: "EMPLOYEE",
      department: "Operations",
      item: "Gloves",
      quantity: 10,
      requesterId: "u1",
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
      supplyRequest: prismaMock.supplyRequest,
    });
    expect(suppliesServiceMock.createSupplyRequest).toHaveBeenCalledWith(payload);
    expect(response.status).toBe(201);
  });

  it("GET /api/supplies lists requests using query params", async () => {
    suppliesServiceMock.listSupplyRequests.mockResolvedValue([]);

    const request = new NextRequest(
      "http://localhost/api/supplies?actorRole=EMPLOYEE&requesterId=u1",
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
      actorRole: "SUPERVISOR",
      requestId: "r1",
    } as const;

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
      actorRole: "SUPERVISOR",
      requestId: "r1",
    });
    expect(response.status).toBe(200);
  });
});
