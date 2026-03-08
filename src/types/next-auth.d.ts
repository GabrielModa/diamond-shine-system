import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import type { UserRole } from "./user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    role?: UserRole;
  }
}
