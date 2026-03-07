import type { User, UserRole } from "../../types/user";
import type {
  CreateUserInput,
  DeactivateUserInput,
  UpdateUserRoleInput,
} from "./users.types";

type UserRecord = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
};

type UserDelegate = {
  create: (args: {
    data: {
      email: string;
      provider: "LOCAL" | "GOOGLE";
      role: UserRole;
    };
    select: {
      id: true;
      email: true;
      role: true;
      createdAt: true;
    };
  }) => Promise<UserRecord>;
  findMany: (args: {
    select: {
      id: true;
      email: true;
      role: true;
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
      role: UserRole;
    };
    select: {
      id: true;
      email: true;
      role: true;
      createdAt: true;
    };
  }) => Promise<UserRecord>;
};

type UsersServiceDeps = {
  user: UserDelegate;
};

const userSelect = {
  createdAt: true,
  email: true,
  id: true,
  role: true,
} as const;

function toUser(record: UserRecord): User {
  return {
    createdAt: record.createdAt,
    email: record.email,
    id: record.id,
    role: record.role,
    status: record.role === "VIEWER" ? "INACTIVE" : "ACTIVE",
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
  return {
    async createUser(input: CreateUserInput): Promise<User> {
      const created = await deps.user.create({
        data: {
          email: input.email,
          provider: input.provider ?? "LOCAL",
          role: input.role ?? "EMPLOYEE",
        },
        select: userSelect,
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

      return toUser(updated);
    },

    async deactivateUser(input: DeactivateUserInput): Promise<User> {
      assertAdmin(input.actorRole);

      const updated = await deps.user.update({
        data: {
          role: "VIEWER",
        },
        select: userSelect,
        where: {
          id: input.userId,
        },
      });

      return toUser(updated);
    },
  };
}

export function createUsersServiceFromPrisma(prisma: UsersServiceDeps) {
  return createUsersService(prisma);
}
