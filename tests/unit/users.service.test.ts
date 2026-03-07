import { createUsersService } from "../../src/modules/users/users.service";
import type {
  CreateUserInput,
  DeactivateUserInput,
  UpdateUserRoleInput,
} from "../../src/modules/users/users.types";

function createPrismaMock() {
  return {
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
  });

  it("blocks role updates from non-admin users", async () => {
    const prisma = createPrismaMock();
    const service = createUsersService(prisma as never);

    const input: UpdateUserRoleInput = {
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
  });

  it("deactivates a user as viewer", async () => {
    const prisma = createPrismaMock();
    const service = createUsersService(prisma as never);

    const input: DeactivateUserInput = {
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
