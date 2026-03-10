import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { logError, logWarn } from "../../../lib/observability/logger";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit, getRequestIp } from "../../../lib/security/rateLimit";
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
    session: prisma.session,
    user: prisma.user,
  });
}

function toErrorResponse(error: unknown, traceId: string): NextResponse {
  if (error instanceof SchemaValidationError) {
    return withTraceId(
      NextResponse.json({ error: error.message }, { status: error.status }),
      traceId,
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  return withTraceId(NextResponse.json({ error: message }, { status: 400 }), traceId);
}

async function getRateLimitResponse(
  request: NextRequest | undefined,
  traceId: string,
): Promise<NextResponse | null> {
  const ip = getRequestIp(request?.headers ?? null);
  const result = await checkRateLimit({
    key: `users:${ip}`,
  });

  if (result.allowed) {
    return null;
  }

  logWarn("Rate limit exceeded", {
    ip,
    key: "users",
    route: "API /api/users",
    traceId,
  });

  return withTraceId(
    NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        headers: {
          "Retry-After": String(result.retryAfterSeconds),
        },
        status: 429,
      },
    ),
    traceId,
  );
}

async function getSessionUser(): Promise<{ id: string; role: UserRole } | null> {
  return getActiveSessionUser();
}

export async function GET(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const rateLimitResponse = await getRateLimitResponse(request, traceId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return withTraceId(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        traceId,
      );
    }

    const result = await getService().listUsers();
    return withTraceId(NextResponse.json(result), traceId);
  } catch (error) {
    logError("Users API error", error, { route: "GET /api/users", traceId });
    return toErrorResponse(error, traceId);
  }
}

export async function POST(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const rateLimitResponse = await getRateLimitResponse(request, traceId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return withTraceId(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        traceId,
      );
    }

    const payload = validateSchema<CreateUserPayload>(createUserSchema, await request.json());
    const result = await getService().createUser({
      ...payload,
      actorId: sessionUser.id,
    } as CreateUserInput);
    return withTraceId(NextResponse.json(result, { status: 201 }), traceId);
  } catch (error) {
    logError("Users API error", error, { route: "POST /api/users", traceId });
    return toErrorResponse(error, traceId);
  }
}

export async function PATCH(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const rateLimitResponse = await getRateLimitResponse(request, traceId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return withTraceId(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        traceId,
      );
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
      return withTraceId(NextResponse.json(result), traceId);
    }

    if (payload.action === "activate") {
      const result = await getService().activateUser({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        userId: payload.userId,
      });
      return withTraceId(NextResponse.json(result), traceId);
    }

    if (payload.action === "updateRole") {
      const result = await getService().updateUserRole({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        role: payload.role,
        userId: payload.userId,
      });
      return withTraceId(NextResponse.json(result), traceId);
    }

    throw new Error("Invalid users action.");
  } catch (error) {
    logError("Users API error", error, { route: "PATCH /api/users", traceId });
    return toErrorResponse(error, traceId);
  }
}
