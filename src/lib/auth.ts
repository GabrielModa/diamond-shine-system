import { AuthProvider } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";
import { canAccessRoute } from "./permissions";
import { checkRateLimit, getRequestIp } from "./security/rateLimit";
import type { AppRoute } from "../types/permissions";
import type { UserRole } from "../types/user";
import { prisma } from "./prisma";

const DEFAULT_ROLE: UserRole = "EMPLOYEE";

export async function authorizeWithCredentials(credentials?: {
  email?: string;
  password?: string;
}, request?: { headers?: Headers | Record<string, string | string[] | undefined> }) {
  if (request?.headers) {
    const ip = getRequestIp(request.headers);
    const rateLimit = await checkRateLimit({
      key: `login:${ip}`,
      limit: 10,
    });

    if (!rateLimit.allowed) {
      return null;
    }
  }

  const email = credentials?.email?.trim().toLowerCase();
  const password = credentials?.password;

  if (!email || !password) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    select: {
      email: true,
      id: true,
      password: true,
      role: true,
      status: true,
    },
    where: {
      email,
    },
  });

  if (!existingUser) {
    return null;
  }

  if (existingUser.status !== "ACTIVE") {
    return null;
  }

  if (!existingUser.password) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, existingUser.password);
  if (!isValidPassword) {
    return null;
  }

  return {
    email: existingUser.email,
    id: existingUser.id,
    role: existingUser.role,
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = (user.role as UserRole | undefined) ?? DEFAULT_ROLE;
      }

      if (!token.role && token.email) {
        const persistedUser = await prisma.user.findUnique({
          select: {
            role: true,
          },
          where: {
            email: token.email,
          },
        });

        token.role = (persistedUser?.role as UserRole | undefined) ?? DEFAULT_ROLE;
      }

      return token;
    },
    async session({ session, token, user }) {
      if (!session.user) {
        session.user = {
          email: "",
          id: "",
          role: DEFAULT_ROLE,
        };
      }

      if (user) {
        session.user.id = user.id;
        session.user.email = user.email ?? "";
        session.user.role = (user.role as UserRole | undefined) ?? DEFAULT_ROLE;
      } else {
        session.user.id = (token.id as string | undefined) ?? "";
        session.user.email = (token.email as string | undefined) ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? DEFAULT_ROLE;
      }

      return session;
    },
    async signIn({ account, user }) {
      if (!user.id || !account?.provider) {
        return true;
      }

      const status = await prisma.user.findUnique({
        select: {
          status: true,
        },
        where: {
          id: user.id,
        },
      });

      if (status?.status === "INACTIVE") {
        return false;
      }

      if (account.provider === "google") {
        await prisma.user.update({
          data: {
            provider: AuthProvider.GOOGLE,
          },
          where: {
            id: user.id,
          },
        });
      }

      if (account.provider === "credentials") {
        await prisma.user.update({
          data: {
            provider: AuthProvider.LOCAL,
          },
          where: {
            id: user.id,
          },
        });
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      name: "Email Login",
      async authorize(credentials, req) {
        return authorizeWithCredentials(credentials, req);
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
  },
};

export async function getActiveSessionUser(): Promise<{ id: string; role: UserRole } | null> {
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: UserRole } | undefined;

  if (!user?.id) {
    return null;
  }

  const persisted = await prisma.user.findUnique({
    select: {
      role: true,
      status: true,
    },
    where: {
      id: user.id,
    },
  });

  if (!persisted || persisted.status !== "ACTIVE") {
    if (user.id) {
      await prisma.session.deleteMany({
        where: {
          userId: user.id,
        },
      });
    }
    return null;
  }

  return {
    id: user.id,
    role: (persisted.role as UserRole | undefined) ?? DEFAULT_ROLE,
  };
}

export async function requireAuthenticatedRoute(route: AppRoute) {
  const sessionUser = await getActiveSessionUser();
  if (!sessionUser) {
    redirect("/login");
  }

  const role = sessionUser.role;

  if (!canAccessRoute(role, route)) {
    redirect("/dashboard");
  }

  return {
    role,
    session: {
      user: sessionUser,
    },
  };
}
