import { createUsersService } from "../../src/modules/users/users.service";
import type {
  CreateUserInput,
  DeactivateUserInput,
  UpdateUserRoleInput,
} from "../../src/modules/users/users.types";

function createPrismaMock() {
  return {
    auditLog: {
      create: vi.fn(),
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
      role: "EMPLOYEE",
      createdAt: new Date("2026-03-07T00:00:00.000Z"),
    });

    const result = await service.createUser(input);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: input.email,
        provider: "LOCAL",
        role: "EMPLOYEE",
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        role: true,
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
      role: input.role,
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
        role: true,
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

  it("deactivates a user as viewer", async () => {
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
      role: "VIEWER",
      createdAt: new Date("2026-03-07T00:00:00.000Z"),
    });

    const result = await service.deactivateUser(input);

    expect(prisma.user.update).toHaveBeenCalledWith({
      data: {
        role: "VIEWER",
      },
      select: {
        createdAt: true,
        email: true,
        id: true,
        role: true,
      },
      where: {
        id: input.userId,
      },
    });
    expect(result.status).toBe("INACTIVE");
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
        role: "ADMIN",
        createdAt: new Date("2026-03-07T00:00:00.000Z"),
      },
      {
        id: "u2",
        email: "viewer@example.com",
        role: "VIEWER",
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
        role: true,
      },
    });
    expect(result[0].status).toBe("ACTIVE");
    expect(result[1].status).toBe("INACTIVE");
  });
});
