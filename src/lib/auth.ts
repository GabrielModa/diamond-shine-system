import { AuthProvider } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";
import { canAccessRoute } from "./permissions";
import { checkRateLimit, getRequestIp } from "./security/rateLimit";
import type { AppRoute } from "../types/permissions";
import type { UserRole } from "../types/user";
import { prisma } from "./prisma";

const DEFAULT_ROLE: UserRole = "EMPLOYEE";

export async function authorizeWithCredentials(
  credentials?: {
    email?: string;
    password?: string;
  },
  request?: { headers?: Headers | Record<string, string | string[] | undefined> }
) {
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

  if (!email || !password) return null;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) return null;

  if (existingUser.status !== "ACTIVE") return null;

  if (!existingUser.password) return null;

  const valid = await bcrypt.compare(password, existingUser.password);

  if (!valid) return null;

  return {
    id: existingUser.id,
    email: existingUser.email,
    role: existingUser.role,
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt", // 🔴 MAIS ESTÁVEL QUE DATABASE
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role ?? DEFAULT_ROLE;
      }

      return token;
    },

    async session({ session, token }) {
      if (!session.user) {
        session.user = {
          id: "",
          email: "",
          role: DEFAULT_ROLE,
        };
      }

      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.role = token.role as UserRole;

      return session;
    },

    async signIn({ account, user }) {
      if (!user.id || !account?.provider) return true;

      const status = await prisma.user.findUnique({
        where: { id: user.id },
        select: { status: true },
      });

      if (status?.status === "INACTIVE") {
        return false;
      }

      if (account.provider === "google") {
        await prisma.user.update({
          where: { id: user.id },
          data: { provider: AuthProvider.GOOGLE },
        });
      }

      if (account.provider === "credentials") {
        await prisma.user.update({
          where: { id: user.id },
          data: { provider: AuthProvider.LOCAL },
        });
      }

      return true;
    },
  },

  providers: [
    CredentialsProvider({
      name: "Email Login",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        return authorizeWithCredentials(credentials, req);
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export async function getActiveSessionUser(): Promise<{ id: string; role: UserRole; email: string } | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return {
    email: session.user.email as string,
    id: session.user.id,
    role: session.user.role as UserRole,
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