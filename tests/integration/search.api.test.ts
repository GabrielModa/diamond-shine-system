import { NextRequest } from "next/server";
const { getActiveSessionUserMock, prismaMock } = vi.hoisted(() => ({ getActiveSessionUserMock: vi.fn(), prismaMock: { feedback: { findMany: vi.fn() }, supplyRequest: { findMany: vi.fn() }, user: { findMany: vi.fn() } } }));
vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));
import { GET } from "../../src/app/api/search/route";
describe("Search API", () => { it("GET /api/search", async () => { getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" }); prismaMock.user.findMany.mockResolvedValue([]); prismaMock.supplyRequest.findMany.mockResolvedValue([]); prismaMock.feedback.findMany.mockResolvedValue([]); const res = await GET(new NextRequest("http://localhost/api/search?q=a")); expect(res.status).toBe(200); }); });
