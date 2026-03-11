import { NextRequest } from "next/server";

const {
  getActiveSessionUserMock,
  prismaMock,
} = vi.hoisted(() => ({
  getActiveSessionUserMock: vi.fn(),
  prismaMock: { notification: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() } },
}));

vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));

import { GET, PATCH, POST } from "../../src/app/api/notifications/route";

describe("Notifications API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" });
  });

  it("GET /api/notifications", async () => {
    prismaMock.notification.findMany.mockResolvedValue([]);
    const res = await GET(new NextRequest("http://localhost/api/notifications"));
    expect(res.status).toBe(200);
  });

  it("POST /api/notifications queues message", async () => {
    prismaMock.notification.create.mockResolvedValue({ id: "n1" });
    const res = await POST(new NextRequest("http://localhost/api/notifications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        channel: "IN_APP",
        message: "Supply approved",
        recipientId: "u2",
        title: "Supply",
      }),
    }));
    expect(res.status).toBe(201);
  });

  it("PATCH /api/notifications marks as read", async () => {
    prismaMock.notification.update.mockResolvedValue({ id: "n1", status: "READ" });
    const res = await PATCH(new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notificationId: "n1" }),
    }));
    expect(res.status).toBe(200);
  });
});
