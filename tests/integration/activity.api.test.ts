import { NextRequest } from "next/server";

const { getActiveSessionUserMock, prismaMock } = vi.hoisted(() => ({
  getActiveSessionUserMock: vi.fn(),
  prismaMock: { activity: { create: vi.fn(), findMany: vi.fn() } },
}));

vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));

import { GET } from "../../src/app/api/activity/route";

describe("Activity API", () => {
  it("GET /api/activity returns feed", async () => {
    getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" });
    prismaMock.activity.findMany.mockResolvedValue([]);
    const res = await GET(new NextRequest("http://localhost/api/activity"));
    expect(res.status).toBe(200);
  });
});
