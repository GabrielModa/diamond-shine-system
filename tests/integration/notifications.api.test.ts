import { NextRequest } from "next/server";
const { getActiveSessionUserMock, prismaMock } = vi.hoisted(() => ({ getActiveSessionUserMock: vi.fn(), prismaMock: { notification: { findMany: vi.fn(), create: vi.fn(), update: vi.fn() } } }));
vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));
import { GET } from "../../src/app/api/notifications/route";
describe("Notifications API", () => { it("GET /api/notifications", async () => { getActiveSessionUserMock.mockResolvedValue({ id: "u1", role: "ADMIN" }); prismaMock.notification.findMany.mockResolvedValue([]); const res = await GET(new NextRequest("http://localhost/api/notifications")); expect(res.status).toBe(200); }); });
