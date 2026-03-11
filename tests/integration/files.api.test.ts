import { NextRequest } from "next/server";

const { getActiveSessionUserMock, prismaMock } = vi.hoisted(() => ({
  getActiveSessionUserMock: vi.fn(),
  prismaMock: { activity: { create: vi.fn() }, file: { create: vi.fn(), findMany: vi.fn() } },
}));
vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));

import { GET, POST } from "../../src/app/api/files/route";

describe("Files API", () => {
  it("GET /api/files lists metadata", async () => {
    getActiveSessionUserMock.mockResolvedValue({ email: "admin@x.com", id: "u1", role: "ADMIN" });
    prismaMock.file.findMany.mockResolvedValue([]);
    const res = await GET(new NextRequest("http://localhost/api/files"));
    expect(res.status).toBe(200);
  });

  it("POST /api/files registers metadata", async () => {
    getActiveSessionUserMock.mockResolvedValue({ email: "admin@x.com", id: "u1", role: "ADMIN" });
    prismaMock.file.create.mockResolvedValue({ id: "f1" });
    const res = await POST(new NextRequest("http://localhost/api/files", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename: "report.csv", mimeType: "text/csv", sizeBytes: 10 }) }));
    expect(res.status).toBe(201);
  });
});
