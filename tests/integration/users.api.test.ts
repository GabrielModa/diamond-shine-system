import { NextRequest } from "next/server";

const {
  createUsersServiceFromPrismaMock,
  getServerSessionMock,
  prismaMock,
  usersServiceMock,
} = vi.hoisted(() => {
  const usersService = {
    createUser: vi.fn(),
    deactivateUser: vi.fn(),
    listUsers: vi.fn(),
    updateUserRole: vi.fn(),
  };

  return {
    createUsersServiceFromPrismaMock: vi.fn(() => usersService),
    getServerSessionMock: vi.fn(),
    prismaMock: {
      user: {},
    },
    usersServiceMock: usersService,
  };
});

vi.mock("../../src/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("../../src/modules/users/users.service", () => ({
  createUsersServiceFromPrisma: createUsersServiceFromPrismaMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

import { GET, PATCH, POST } from "../../src/app/api/users/route";

describe("Users API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSessionMock.mockResolvedValue({
      user: {
        email: "admin@example.com",
        id: "u-admin",
        role: "ADMIN",
      },
    });
  });

  it("POST /api/users creates a user", async () => {
    const payload = {
      email: "new.user@example.com",
      role: "EMPLOYEE",
    };

    usersServiceMock.createUser.mockResolvedValue({
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      email: payload.email,
      id: "u1",
      role: payload.role,
      status: "ACTIVE",
    });

    const request = new NextRequest("http://localhost/api/users", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    const response = await POST(request);

    expect(createUsersServiceFromPrismaMock).toHaveBeenCalledWith({
      user: prismaMock.user,
    });
    expect(usersServiceMock.createUser).toHaveBeenCalledWith(payload);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      email: payload.email,
      id: "u1",
    });
  });

  it("GET /api/users lists users", async () => {
    usersServiceMock.listUsers.mockResolvedValue([
      {
        createdAt: new Date("2026-03-08T00:00:00.000Z"),
        email: "admin@example.com",
        id: "u1",
        role: "ADMIN",
        status: "ACTIVE",
      },
    ]);

    const response = await GET();

    expect(usersServiceMock.listUsers).toHaveBeenCalledWith();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toHaveLength(1);
  });

  it("PATCH /api/users updates role", async () => {
    const payload = {
      action: "updateRole",
      role: "SUPERVISOR",
      userId: "u1",
    } as const;

    usersServiceMock.updateUserRole.mockResolvedValue({
      createdAt: new Date("2026-03-08T00:00:00.000Z"),
      email: "supervisor@example.com",
      id: "u1",
      role: "SUPERVISOR",
      status: "ACTIVE",
    });

    const request = new NextRequest("http://localhost/api/users", {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
      },
      method: "PATCH",
    });

    const response = await PATCH(request);

    expect(usersServiceMock.updateUserRole).toHaveBeenCalledWith({
      actorRole: "ADMIN",
      role: "SUPERVISOR",
      userId: "u1",
    });
    expect(response.status).toBe(200);
  });

  it("returns 401 when session does not exist", async () => {
    getServerSessionMock.mockResolvedValue(null);

    const response = await GET();

    expect(usersServiceMock.listUsers).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: "Unauthorized",
    });
  });
});
