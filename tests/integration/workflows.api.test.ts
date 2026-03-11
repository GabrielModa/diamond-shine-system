import { NextRequest } from "next/server";
const { getActiveSessionUserMock, prismaMock } = vi.hoisted(() => ({ getActiveSessionUserMock: vi.fn(), prismaMock: { workflowInstance: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() } } }));
vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));
import { GET } from "../../src/app/api/workflows/route";
describe("Workflows API", () => { it("GET /api/workflows", async () => { getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" }); prismaMock.workflowInstance.findMany.mockResolvedValue([]); const res = await GET(new NextRequest("http://localhost/api/workflows")); expect(res.status).toBe(200); }); });
