import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { logError, logWarn } from "../../../lib/observability/logger";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit, getRequestIp } from "../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import { createUserSchema, patchUserSchema } from "../../../lib/validation/user.schema";
import { createAuthenticationServiceFromPrisma } from "../../../modules/auth/auth.service";
import { createUsersServiceFromPrisma } from "../../../modules/users/users.service";
import type { CreateUserInput } from "../../../modules/users/users.types";
import type { UserRole } from "../../../types/user";

type DeactivateUserPayload = { action: "deactivate"; userId: string };
type ActivateUserPayload = { action: "activate"; userId: string };
type UpdateRolePayload = { action: "updateRole"; role: UserRole; userId: string };
type ResetPasswordPayload = { action: "resetPassword"; userId: string };
type CreateUserPayload = { email: string; provider?: "LOCAL" | "GOOGLE"; role?: UserRole };

function getService() {
  return createUsersServiceFromPrisma({ auditLog: prisma.auditLog, session: prisma.session, user: prisma.user });
}

function getAuthService() {
  return createAuthenticationServiceFromPrisma({
    auditLog: prisma.auditLog,
    session: prisma.session,
    user: prisma.user,
    verificationToken: prisma.verificationToken,
  });
}

function toErrorResponse(error: unknown, traceId: string): NextResponse {
  if (error instanceof SchemaValidationError) {
    return withTraceId(NextResponse.json({ error: error.message }, { status: error.status }), traceId);
  }
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return withTraceId(NextResponse.json({ error: message }, { status: 400 }), traceId);
}

async function getRateLimitResponse(request: NextRequest | undefined, traceId: string): Promise<NextResponse | null> {
  const ip = getRequestIp(request?.headers ?? null);
  const result = await checkRateLimit({ key: `users:${ip}` });
  if (result.allowed) return null;

  logWarn("Rate limit exceeded", { ip, key: "users", route: "API /api/users", traceId });
  return withTraceId(NextResponse.json({ error: "Too many requests. Please try again later." }, { headers: { "Retry-After": String(result.retryAfterSeconds) }, status: 429 }), traceId);
}

async function getSessionUser(): Promise<{ id: string; role: UserRole } | null> {
  return getActiveSessionUser();
}

export async function GET(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const rateLimitResponse = await getRateLimitResponse(request, traceId);
    if (rateLimitResponse) return rateLimitResponse;

    const sessionUser = await getSessionUser();
    if (!sessionUser) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);

    return withTraceId(NextResponse.json(await getService().listUsers()), traceId);
  } catch (error) {
    logError("Users API error", error, { route: "GET /api/users", traceId });
    return toErrorResponse(error, traceId);
  }
}

export async function POST(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const rateLimitResponse = await getRateLimitResponse(request, traceId);
    if (rateLimitResponse) return rateLimitResponse;

    const sessionUser = await getSessionUser();
    if (!sessionUser) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);

    const payload = validateSchema<CreateUserPayload>(createUserSchema, await request.json());
    const result = await getService().createUser({ ...payload, actorId: sessionUser.id } as CreateUserInput);
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
    if (rateLimitResponse) return rateLimitResponse;

    const sessionUser = await getSessionUser();
    if (!sessionUser) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);

    const payload = validateSchema<UpdateRolePayload | DeactivateUserPayload | ActivateUserPayload | ResetPasswordPayload>(patchUserSchema, await request.json());

    if (payload.action === "deactivate") {
      return withTraceId(NextResponse.json(await getService().deactivateUser({ actorId: sessionUser.id, actorRole: sessionUser.role, userId: payload.userId })), traceId);
    }

    if (payload.action === "activate") {
      return withTraceId(NextResponse.json(await getService().activateUser({ actorId: sessionUser.id, actorRole: sessionUser.role, userId: payload.userId })), traceId);
    }

    if (payload.action === "updateRole") {
      return withTraceId(NextResponse.json(await getService().updateUserRole({ actorId: sessionUser.id, actorRole: sessionUser.role, role: payload.role, userId: payload.userId })), traceId);
    }

    if (payload.action === "resetPassword") {
      if (sessionUser.role !== "ADMIN") {
        return withTraceId(NextResponse.json({ error: "Only admins can reset passwords." }, { status: 403 }), traceId);
      }

      const targetUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true } });
      if (!targetUser) {
        return withTraceId(NextResponse.json({ error: "User not found." }, { status: 404 }), traceId);
      }

      await getAuthService().requestPasswordReset({
        baseUrl: request.nextUrl.origin,
        email: targetUser.email,
      });

      await prisma.auditLog.create({
        data: {
          action: "USER_PASSWORD_RESET_REQUESTED",
          actorId: sessionUser.id,
          entity: "User",
          entityId: payload.userId,
        },
      });

      return withTraceId(NextResponse.json({ message: "Password reset link generated." }), traceId);
    }

    throw new Error("Invalid users action.");
  } catch (error) {
    logError("Users API error", error, { route: "PATCH /api/users", traceId });
    return toErrorResponse(error, traceId);
  }
}
