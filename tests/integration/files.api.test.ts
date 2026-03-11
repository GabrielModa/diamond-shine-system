import { NextRequest } from "next/server";

const { getActiveSessionUserMock, prismaMock } = vi.hoisted(() => ({
  getActiveSessionUserMock: vi.fn(),
  prismaMock: { file: { findMany: vi.fn(), create: vi.fn() } },
}));

vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));

import { GET } from "../../src/app/api/files/route";

describe("Files API", () => {
  it("GET /api/files returns file list for authenticated users", async () => {
    getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" });
    prismaMock.file.findMany.mockResolvedValue([]);

    const res = await GET(new NextRequest("http://localhost/api/files"));

    expect(res.status).toBe(200);
    expect(prismaMock.file.findMany).toHaveBeenCalledOnce();
  });

  it("GET /api/files returns 401 for anonymous users", async () => {
    getActiveSessionUserMock.mockResolvedValue(null);

    const res = await GET(new NextRequest("http://localhost/api/files"));

    expect(res.status).toBe(401);
  });
});
