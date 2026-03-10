import { AuthProvider } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import type { UserRole } from "../../types/user";

type RegisteredUser = {
  email: string;
  id: string;
  name: string | null;
  role: UserRole;
};

type UserDelegate = {
  create: (args: {
    data: {
      email: string;
      name: string;
      password: string;
      provider: AuthProvider;
      role: UserRole;
      status: "ACTIVE";
    };
    select: {
      email: true;
      id: true;
      name: true;
      role: true;
    };
  }) => Promise<RegisteredUser>;
  findUnique: (args: {
    where: {
      email: string;
    };
  }) => Promise<{ email?: string; id: string } | null>;
  update: (args: {
    data: {
      password: string;
      provider: AuthProvider;
    };
    where: {
      email: string;
    };
  }) => Promise<unknown>;
};

type VerificationTokenDelegate = {
  create: (args: {
    data: {
      expires: Date;
      identifier: string;
      token: string;
    };
  }) => Promise<unknown>;
  delete: (args: {
    where: {
      token: string;
    };
  }) => Promise<unknown>;
  deleteMany: (args: {
    where: {
      identifier: string;
    };
  }) => Promise<unknown>;
  findUnique: (args: {
    where: {
      token: string;
    };
  }) => Promise<{
    expires: Date;
    identifier: string;
    token: string;
  } | null>;
};

type AuthenticationServiceDeps = {
  user: UserDelegate;
  verificationToken: VerificationTokenDelegate;
};

const REGISTER_SELECT = {
  email: true,
  id: true,
  name: true,
  role: true,
} as const;

const RESET_TOKEN_PREFIX = "password-reset:";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAuthenticationService(deps: AuthenticationServiceDeps) {
  return {
    async registerUser(input: { email: string; name: string; password: string }) {
      const email = normalizeEmail(input.email);
      const name = input.name.trim();
      const password = input.password;

      if (!email || !name || !password) {
        throw new Error("Name, email, and password are required.");
      }

      const existingUser = await deps.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser) {
        throw new Error("An account with this email already exists.");
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      return deps.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          provider: AuthProvider.LOCAL,
          role: "EMPLOYEE",
          status: "ACTIVE",
        },
        select: REGISTER_SELECT,
      });
    },

    async requestPasswordReset(input: { baseUrl: string; email: string }) {
      const email = normalizeEmail(input.email);

      if (!email) {
        throw new Error("Email is required.");
      }

      const user = await deps.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        return;
      }

      const identifier = `${RESET_TOKEN_PREFIX}${email}`;
      const rawToken = randomBytes(32).toString("hex");
      const hashedToken = hashResetToken(rawToken);

      await deps.verificationToken.deleteMany({
        where: {
          identifier,
        },
      });

      await deps.verificationToken.create({
        data: {
          expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          identifier,
          token: hashedToken,
        },
      });

      console.log(`Password reset link: ${input.baseUrl}/reset-password/${rawToken}`);
    },

    async resetPassword(input: { password: string; token: string }) {
      const password = input.password;
      const hashedToken = hashResetToken(input.token);
      const storedToken = await deps.verificationToken.findUnique({
        where: {
          token: hashedToken,
        },
      });

      if (!storedToken || storedToken.expires.getTime() <= Date.now()) {
        if (storedToken) {
          await deps.verificationToken.delete({
            where: {
              token: hashedToken,
            },
          });
        }

        throw new Error("Invalid or expired reset token.");
      }

      const email = storedToken.identifier.replace(RESET_TOKEN_PREFIX, "");
      const hashedPassword = await bcrypt.hash(password, 12);

      await deps.user.update({
        data: {
          password: hashedPassword,
          provider: AuthProvider.LOCAL,
        },
        where: {
          email,
        },
      });

      await deps.verificationToken.delete({
        where: {
          token: hashedToken,
        },
      });
    },
  };
}

export function createAuthenticationServiceFromPrisma(prisma: AuthenticationServiceDeps) {
  return createAuthenticationService(prisma);
}
