import { NextRequest } from "next/server";
const { getActiveSessionUserMock, prismaMock } = vi.hoisted(() => ({ getActiveSessionUserMock: vi.fn(), prismaMock: { setting: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() } } }));
vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));
import { GET } from "../../src/app/api/settings/route";
describe("Settings API", () => { it("GET /api/settings", async () => { getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" }); prismaMock.setting.findMany.mockResolvedValue([]); const res = await GET(new NextRequest("http://localhost/api/settings")); expect(res.status).toBe(200); }); });
