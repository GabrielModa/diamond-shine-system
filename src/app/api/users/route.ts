import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit } from "../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import {
  createUserSchema,
  patchUserSchema,
} from "../../../lib/validation/user.schema";
import { createUsersServiceFromPrisma } from "../../../modules/users/users.service";
import type { CreateUserInput } from "../../../modules/users/users.types";
import type { UserRole } from "../../../types/user";

type DeactivateUserPayload = {
  action: "deactivate";
  userId: string;
};

type ActivateUserPayload = {
  action: "activate";
  userId: string;
};

type UpdateRolePayload = {
  action: "updateRole";
  role: UserRole;
  userId: string;
};

type CreateUserPayload = {
  email: string;
  provider?: "LOCAL" | "GOOGLE";
  role?: UserRole;
};

function getService() {
  return createUsersServiceFromPrisma({
    auditLog: prisma.auditLog,
    user: prisma.user,
  });
}

function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof SchemaValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

function getRateLimitResponse(request: NextRequest | undefined): NextResponse | null {
  const ip = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const result = checkRateLimit({
    key: `users:${ip}`,
  });

  if (result.allowed) {
    return null;
  }

  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
      status: 429,
    },
  );
}

async function getSessionUser(): Promise<{ id: string; role: UserRole } | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: UserRole } | undefined;

  if (!user?.id || !user.role) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
  };
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitResponse = getRateLimitResponse(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
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
    const rateLimitResponse = getRateLimitResponse(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = validateSchema<CreateUserPayload>(createUserSchema, await request.json());
    const result = await getService().createUser({
      ...payload,
      actorId: sessionUser.id,
    } as CreateUserInput);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const rateLimitResponse = getRateLimitResponse(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = validateSchema<UpdateRolePayload | DeactivateUserPayload | ActivateUserPayload>(
      patchUserSchema,
      await request.json(),
    );

    if (payload.action === "deactivate") {
      const result = await getService().deactivateUser({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        userId: payload.userId,
      });
      return NextResponse.json(result);
    }

    if (payload.action === "activate") {
      const result = await getService().activateUser({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        userId: payload.userId,
      });
      return NextResponse.json(result);
    }

    if (payload.action === "updateRole") {
      const result = await getService().updateUserRole({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
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
