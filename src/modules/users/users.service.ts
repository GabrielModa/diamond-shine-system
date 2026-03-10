import type { User, UserRole } from "../../types/user";
import { createAuditService } from "../audit/audit.service";
import type {
  ActivateUserInput,
  CreateUserInput,
  DeactivateUserInput,
  UpdateUserRoleInput,
} from "./users.types";

type UserRecord = {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  createdAt: Date;
};

type UserDelegate = {
  create: (args: {
    data: {
      email: string;
      provider: "LOCAL" | "GOOGLE";
      role: UserRole;
      status: "ACTIVE";
    };
    select: {
      id: true;
      name: true;
      email: true;
      role: true;
      status: true;
      createdAt: true;
    };
  }) => Promise<UserRecord>;
  findMany: (args: {
    select: {
      id: true;
      name: true;
      email: true;
      role: true;
      status: true;
      createdAt: true;
    };
    orderBy: {
      createdAt: "desc";
    };
  }) => Promise<UserRecord[]>;
  update: (args: {
    where: {
      id: string;
    };
    data: {
      role?: UserRole;
      status?: "ACTIVE" | "INACTIVE";
    };
    select: {
      id: true;
      name: true;
      email: true;
      role: true;
      status: true;
      createdAt: true;
    };
  }) => Promise<UserRecord>;
};

type UsersServiceDeps = {
  auditLog: {
    create: (args: {
      data: {
        actorId: string;
        action: string;
        entity: string;
        entityId: string;
        metadata?: unknown;
      };
    }) => Promise<unknown>;
  };
  user: UserDelegate;
};

const userSelect = {
  createdAt: true,
  email: true,
  id: true,
  name: true,
  role: true,
  status: true,
} as const;

function toUser(record: UserRecord): User {
  return {
    createdAt: record.createdAt,
    email: record.email,
    id: record.id,
    name: record.name ?? null,
    role: record.role,
    status: record.status,
  };
}

function assertAdmin(actorRole: UserRole): void {
  if (actorRole !== "ADMIN") {
    throw new Error("Only admins can change user roles.");
  }
}

export function createUsersService(
  deps: UsersServiceDeps,
) {
  const auditService = createAuditService({
    auditLog: deps.auditLog,
  });

  return {
    async createUser(input: CreateUserInput): Promise<User> {
      const created = await deps.user.create({
        data: {
          email: input.email,
          provider: input.provider ?? "LOCAL",
          role: input.role ?? "EMPLOYEE",
          status: "ACTIVE",
        },
        select: userSelect,
      });

      await auditService.createAuditLog({
        action: "USER_CREATED",
        actorId: input.actorId,
        entity: "User",
        entityId: created.id,
        metadata: {
          role: created.role,
        },
      });

      return toUser(created);
    },

    async listUsers(): Promise<User[]> {
      const users = await deps.user.findMany({
        orderBy: {
          createdAt: "desc",
        },
        select: userSelect,
      });

      return users.map(toUser);
    },

    async updateUserRole(input: UpdateUserRoleInput): Promise<User> {
      assertAdmin(input.actorRole);

      const updated = await deps.user.update({
        data: {
          role: input.role,
        },
        select: userSelect,
        where: {
          id: input.userId,
        },
      });

      await auditService.createAuditLog({
        action: "USER_ROLE_UPDATED",
        actorId: input.actorId,
        entity: "User",
        entityId: input.userId,
        metadata: {
          role: input.role,
        },
      });

      return toUser(updated);
    },

    async deactivateUser(input: DeactivateUserInput): Promise<User> {
      assertAdmin(input.actorRole);

      const updated = await deps.user.update({
        data: {
          status: "INACTIVE",
        },
        select: userSelect,
        where: {
          id: input.userId,
        },
      });

      await auditService.createAuditLog({
        action: "USER_DEACTIVATED",
        actorId: input.actorId,
        entity: "User",
        entityId: input.userId,
      });

      return toUser(updated);
    },

    async activateUser(input: ActivateUserInput): Promise<User> {
      assertAdmin(input.actorRole);

      const updated = await deps.user.update({
        data: {
          status: "ACTIVE",
        },
        select: userSelect,
        where: {
          id: input.userId,
        },
      });

      await auditService.createAuditLog({
        action: "USER_ACTIVATED",
        actorId: input.actorId,
        entity: "User",
        entityId: input.userId,
      });

      return toUser(updated);
    },
  };
}

export function createUsersServiceFromPrisma(prisma: UsersServiceDeps) {
  return createUsersService(prisma);
}
