import { NextRequest } from "next/server";

const {
  createAuthenticationServiceFromPrismaMock,
  createUsersServiceFromPrismaMock,
  getActiveSessionUserMock,
  prismaMock,
  usersServiceMock,
  authServiceMock,
} = vi.hoisted(() => {
  const usersService = {
    activateUser: vi.fn(),
    createUser: vi.fn(),
    deactivateUser: vi.fn(),
    listUsers: vi.fn(),
    updateUserRole: vi.fn(),
  };

  const authService = {
    requestPasswordReset: vi.fn(),
  };

  return {
    authServiceMock: authService,
    createAuthenticationServiceFromPrismaMock: vi.fn(() => authService),
    createUsersServiceFromPrismaMock: vi.fn(() => usersService),
    getActiveSessionUserMock: vi.fn(),
    prismaMock: {
      auditLog: { create: vi.fn() },
      session: {},
      user: { findUnique: vi.fn() },
      verificationToken: {},
    },
    usersServiceMock: usersService,
  };
});

vi.mock("../../src/lib/auth", () => ({ getActiveSessionUser: getActiveSessionUserMock }));
vi.mock("../../src/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("../../src/modules/users/users.service", () => ({ createUsersServiceFromPrisma: createUsersServiceFromPrismaMock }));
vi.mock("../../src/modules/auth/auth.service", () => ({ createAuthenticationServiceFromPrisma: createAuthenticationServiceFromPrismaMock }));

import { GET, PATCH, POST } from "../../src/app/api/users/route";

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

  it("PATCH /api/users resetPassword requests token generation", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ email: "employee@example.com" });
    authServiceMock.requestPasswordReset.mockResolvedValue(undefined);

    const response = await PATCH(new NextRequest("http://localhost/api/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "resetPassword", userId: "u-employee" }) }));

    expect(response.status).toBe(200);
    expect(authServiceMock.requestPasswordReset).toHaveBeenCalledWith({
      baseUrl: "http://localhost",
      email: "employee@example.com",
    });
  });
});
