import { NextRequest, NextResponse } from "next/server";
import { withTraceId } from "../../../lib/observability/http";
import { logError, logWarn } from "../../../lib/observability/logger";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit, getRequestIp } from "../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import { forgotPasswordSchema } from "../../../lib/validation/auth.schema";
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

function getBaseUrl(request: NextRequest) {
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  const traceId = getTraceId(request.headers);

  try {
    const ip = getRequestIp(request.headers);
    const rateLimit = await checkRateLimit({
      key: `password-reset:${ip}`,
      limit: 5,
    });

    if (!rateLimit.allowed) {
      logWarn("Rate limit exceeded", {
        ip,
        key: "password-reset",
        route: "POST /api/password-reset",
        traceId,
      });
      return withTraceId(
        NextResponse.json(
          { error: "Too many requests. Please try again later." },
          {
            headers: {
              "Retry-After": String(rateLimit.retryAfterSeconds),
            },
            status: 429,
          },
        ),
        traceId,
      );
    }

    const payload = validateSchema(forgotPasswordSchema, await request.json());

    await getService().requestPasswordReset({
      baseUrl: getBaseUrl(request),
      email: payload.email,
    });

    return withTraceId(
      NextResponse.json({
        message: "If the account exists, a password reset link has been generated.",
      }),
      traceId,
    );
  } catch (error) {
    logError("Password reset request error", error, {
      route: "POST /api/password-reset",
      traceId,
    });
    return toErrorResponse(error, traceId);
  }
}
