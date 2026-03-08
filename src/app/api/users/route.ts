import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { createUsersServiceFromPrisma } from "../../../modules/users/users.service";
import type { CreateUserInput } from "../../../modules/users/users.types";
import type { UserRole } from "../../../types/user";

type DeactivateUserPayload = {
  action: "deactivate";
  userId: string;
};

type UpdateRolePayload = {
  action: "updateRole";
  role: UserRole;
  userId: string;
};

function getService() {
  return createUsersServiceFromPrisma({
    user: prisma.user,
  });
}

function toErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

async function getAuthenticatedRole(): Promise<UserRole | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as { role?: UserRole } | undefined)?.role ?? null;
}

export async function GET() {
  try {
    const actorRole = await getAuthenticatedRole();
    if (!actorRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getService().listUsers();
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionRole = await getAuthenticatedRole();
    if (!sessionRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as CreateUserInput;
    const result = await getService().createUser(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionRole = await getAuthenticatedRole();
    if (!sessionRole) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as UpdateRolePayload | DeactivateUserPayload;

    if (payload.action === "deactivate") {
      const result = await getService().deactivateUser({
        actorRole: sessionRole,
        userId: payload.userId,
      });
      return NextResponse.json(result);
    }

    if (payload.action === "updateRole") {
      const result = await getService().updateUserRole({
        actorRole: sessionRole,
        role: payload.role,
        userId: payload.userId,
      });
      return NextResponse.json(result);
    }

    throw new Error("Invalid users action.");
  } catch (error) {
    return toErrorResponse(error);
  }
}
