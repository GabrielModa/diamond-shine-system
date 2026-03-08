import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { createUsersServiceFromPrisma } from "../../../modules/users/users.service";
import type { CreateUserInput, UpdateUserRoleInput } from "../../../modules/users/users.types";
import type { UserRole } from "../../../types/user";

type DeactivateUserPayload = {
  action: "deactivate";
  actorRole: UserRole;
  userId: string;
};

type UpdateRolePayload = UpdateUserRoleInput & {
  action: "updateRole";
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

export async function GET() {
  try {
    const result = await getService().listUsers();
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CreateUserInput;
    const result = await getService().createUser(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = (await request.json()) as UpdateRolePayload | DeactivateUserPayload;

    if (payload.action === "deactivate") {
      const result = await getService().deactivateUser({
        actorRole: payload.actorRole,
        userId: payload.userId,
      });
      return NextResponse.json(result);
    }

    if (payload.action === "updateRole") {
      const result = await getService().updateUserRole({
        actorRole: payload.actorRole,
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
