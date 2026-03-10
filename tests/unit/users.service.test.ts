import { createUsersService } from "../../src/modules/users/users.service";
import type {
  ActivateUserInput,
  CreateUserInput,
  DeactivateUserInput,
  UpdateUserRoleInput,
} from "../../src/modules/users/users.types";

function createPrismaMock() {
  return {
    auditLog: {
      create: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("Users service", () => {
  it("creates a user with defaults", async () => {
    const prisma = createPrismaMock();
    const service = createUsersService(prisma as never);

    const input: CreateUserInput = {
      actorId: "u-admin",
      email: "test@example.com",
    };

    prisma.user.create.mockResolvedValue({
      id: "u1",
      email: input.email,
      name: null,
      role: "EMPLOYEE",
      status: "ACTIVE",
      createdAt: new Date("2026-03-07T00:00:00.000Z"),
    });

    const result = await service.createUser(input);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: input.email,
        provider: "LOCAL",
        role: "EMPLOYEE",
        status: "ACTIVE",
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
        role: true,
        status: true,
      },
    });
    expect(result.status).toBe("ACTIVE");
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "USER_CREATED",
        actorId: input.actorId,
        entity: "User",
        entityId: "u1",
        metadata: {
          role: "EMPLOYEE",
        },
      },
    });
  });

  it("blocks role updates from non-admin users", async () => {
    const prisma = createPrismaMock();
    const service = createUsersService(prisma as never);

    const input: UpdateUserRoleInput = {
      actorId: "u-supervisor",
      actorRole: "SUPERVISOR",
      role: "EMPLOYEE",
      userId: "u1",
    };

    await expect(service.updateUserRole(input)).rejects.toThrow(
      "Only admins can change user roles.",
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("updates a user role when actor is admin", async () => {
    const prisma = createPrismaMock();
    const service = createUsersService(prisma as never);

    const input: UpdateUserRoleInput = {
      actorId: "u-admin",
      actorRole: "ADMIN",
      role: "SUPERVISOR",
      userId: "u1",
    };

    prisma.user.update.mockResolvedValue({
      id: input.userId,
      email: "test@example.com",
      name: null,
      role: input.role,
      status: "ACTIVE",
      createdAt: new Date("2026-03-07T00:00:00.000Z"),
    });

    const result = await service.updateUserRole(input);

    expect(prisma.user.update).toHaveBeenCalledWith({
      data: {
        role: input.role,
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
        role: true,
        status: true,
      },
      where: {
        id: input.userId,
      },
    });
    expect(result.role).toBe("SUPERVISOR");
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "USER_ROLE_UPDATED",
        actorId: input.actorId,
        entity: "User",
        entityId: input.userId,
        metadata: {
          role: input.role,
        },
      },
    });
  });

  it("deactivates a user and revokes sessions", async () => {
    const prisma = createPrismaMock();
    const service = createUsersService(prisma as never);

    const input: DeactivateUserInput = {
      actorId: "u-admin",
      actorRole: "ADMIN",
      userId: "u1",
    };

    prisma.user.update.mockResolvedValue({
      id: input.userId,
      email: "test@example.com",
      name: null,
      role: "EMPLOYEE",
      status: "INACTIVE",
      createdAt: new Date("2026-03-07T00:00:00.000Z"),
    });

    const result = await service.deactivateUser(input);

    expect(prisma.user.update).toHaveBeenCalledWith({
      data: {
        status: "INACTIVE",
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
        role: true,
        status: true,
      },
      where: {
        id: input.userId,
      },
    });
    expect(result.status).toBe("INACTIVE");
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: input.userId,
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "USER_DEACTIVATED",
        actorId: input.actorId,
        entity: "User",
        entityId: input.userId,
      },
    });
  });

  it("lists users and maps status from role", async () => {
    const prisma = createPrismaMock();
    const service = createUsersService(prisma as never);

    prisma.user.findMany.mockResolvedValue([
      {
        id: "u1",
        email: "admin@example.com",
        name: null,
        role: "ADMIN",
        status: "ACTIVE",
        createdAt: new Date("2026-03-07T00:00:00.000Z"),
      },
      {
        id: "u2",
        email: "viewer@example.com",
        name: null,
        role: "VIEWER",
        status: "INACTIVE",
        createdAt: new Date("2026-03-06T00:00:00.000Z"),
      },
    ]);

    const result = await service.listUsers();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
        role: true,
        status: true,
      },
    });
    expect(result[0].status).toBe("ACTIVE");
    expect(result[1].status).toBe("INACTIVE");
  });

  it("activates a user as admin", async () => {
    const prisma = createPrismaMock();
    const service = createUsersService(prisma as never);

    const input: ActivateUserInput = {
      actorId: "u-admin",
      actorRole: "ADMIN",
      userId: "u1",
    };

    prisma.user.update.mockResolvedValue({
      id: input.userId,
      email: "test@example.com",
      name: null,
      role: "EMPLOYEE",
      status: "ACTIVE",
      createdAt: new Date("2026-03-07T00:00:00.000Z"),
    });

    const result = await service.activateUser(input);

    expect(prisma.user.update).toHaveBeenCalledWith({
      data: {
        status: "ACTIVE",
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
        role: true,
        status: true,
      },
      where: {
        id: input.userId,
      },
    });
    expect(result.status).toBe("ACTIVE");
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "USER_ACTIVATED",
        actorId: input.actorId,
        entity: "User",
        entityId: input.userId,
      },
    });
  });
});
