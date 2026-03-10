import { NextRequest, NextResponse } from "next/server";
import { withTraceId } from "../../../lib/observability/http";
import { logError, logWarn } from "../../../lib/observability/logger";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit, getRequestIp } from "../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import { registerSchema } from "../../../lib/validation/auth.schema";
import { createAuthenticationServiceFromPrisma } from "../../../modules/auth/auth.service";

function getService() {
  return createAuthenticationServiceFromPrisma({
    auditLog: prisma.auditLog,
    session: prisma.session,
    user: prisma.user,
    verificationToken: prisma.verificationToken,
  });
}

function toErrorResponse(error: unknown, traceId: string) {
  if (error instanceof SchemaValidationError) {
    return withTraceId(
      NextResponse.json({ error: error.message }, { status: error.status }),
      traceId,
    );
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  return withTraceId(NextResponse.json({ error: message }, { status: 400 }), traceId);
}

async function getRateLimitResponse(request: NextRequest, traceId: string) {
  const ip = getRequestIp(request.headers);
  const result = await checkRateLimit({
    key: `register:${ip}`,
    limit: 10,
  });

  if (result.allowed) {
    return null;
  }

  logWarn("Rate limit exceeded", {
    ip,
    key: "register",
    route: "POST /api/register",
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

export async function POST(request: NextRequest) {
  const traceId = getTraceId(request.headers);

  try {
    const rateLimitResponse = await getRateLimitResponse(request, traceId);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const payload = validateSchema(registerSchema, await request.json());
    const user = await getService().registerUser(payload);

    return withTraceId(NextResponse.json(user, { status: 201 }), traceId);
  } catch (error) {
    logError("Register API error", error, { route: "POST /api/register", traceId });
    return toErrorResponse(error, traceId);
  }
}
