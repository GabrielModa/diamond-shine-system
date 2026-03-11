import { NextRequest } from "next/server";
const { getActiveSessionUserMock, prismaMock } = vi.hoisted(() => ({ getActiveSessionUserMock: vi.fn(), prismaMock: { job: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() } } }));
vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));
import { GET } from "../../src/app/api/jobs/route";
describe("Jobs API", () => { it("GET /api/jobs", async () => { getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" }); prismaMock.job.findMany.mockResolvedValue([]); const res = await GET(new NextRequest("http://localhost/api/jobs")); expect(res.status).toBe(200); }); });
