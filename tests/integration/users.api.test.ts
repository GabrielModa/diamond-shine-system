import { NextRequest } from "next/server";

const {
  createUsersServiceFromPrismaMock,
  getActiveSessionUserMock,
  prismaMock,
  usersServiceMock,
} = vi.hoisted(() => {
  const usersService = {
    activateUser: vi.fn(),
    createUser: vi.fn(),
    deactivateUser: vi.fn(),
    listUsers: vi.fn(),
    updateUserRole: vi.fn(),
  };

  return {
    createUsersServiceFromPrismaMock: vi.fn(() => usersService),
    getActiveSessionUserMock: vi.fn(),
    prismaMock: { auditLog: {}, session: {}, user: {} },
    usersServiceMock: usersService,
  };
});

vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("../../src/modules/users/users.service", () => ({ createUsersServiceFromPrisma: createUsersServiceFromPrismaMock }));

import { GET, POST } from "../../src/app/api/users/route";

describe("Users API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveSessionUserMock.mockResolvedValue({ id: "u-admin", role: "ADMIN" });
  });

  it("GET /api/users lists users", async () => {
    usersServiceMock.listUsers.mockResolvedValue([]);
    const response = await GET(new NextRequest("http://localhost/api/users", { method: "GET" }));
    expect(response.status).toBe(200);
  });

  it("POST /api/users creates user", async () => {
    usersServiceMock.createUser.mockResolvedValue({ id: "u2", email: "new@example.com" });
    const response = await POST(new NextRequest("http://localhost/api/users", { method: "POST", body: JSON.stringify({ email: "new@example.com", role: "EMPLOYEE" }), headers: { "content-type": "application/json" } }));
    expect(response.status).toBe(201);
  });
});
