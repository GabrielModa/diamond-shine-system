import { NextRequest } from "next/server";
const { getActiveSessionUserMock, prismaMock } = vi.hoisted(() => ({ getActiveSessionUserMock: vi.fn(), prismaMock: { report: { findMany: vi.fn(), create: vi.fn() } } }));
vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));
import { GET } from "../../src/app/api/reports/route";
describe("Reports API", () => { it("GET /api/reports", async () => { getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" }); prismaMock.report.findMany.mockResolvedValue([]); const res = await GET(new NextRequest("http://localhost/api/reports")); expect(res.status).toBe(200); }); });
