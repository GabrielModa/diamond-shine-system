import { NextRequest, NextResponse } from "next/server";
import { withTraceId } from "../../../../lib/observability/http";
import { logError, logWarn } from "../../../../lib/observability/logger";
import { getTraceId } from "../../../../lib/observability/trace";
import { prisma } from "../../../../lib/prisma";
import { checkRateLimit, getRequestIp } from "../../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../../lib/security/validate";
import { resetPasswordSchema } from "../../../../lib/validation/auth.schema";
import { createAuthenticationServiceFromPrisma } from "../../../../modules/auth/auth.service";

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const traceId = getTraceId(request.headers);

  try {
    const ip = getRequestIp(request.headers);
    const rateLimit = await checkRateLimit({
      key: `reset-password:${ip}`,
      limit: 10,
    });

    if (!rateLimit.allowed) {
      logWarn("Rate limit exceeded", {
        ip,
        key: "reset-password",
        route: "POST /api/reset-password/[token]",
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

    const { token } = await context.params;
    const payload = validateSchema(resetPasswordSchema, await request.json());

    await getService().resetPassword({
      password: payload.password,
      token,
    });

    return withTraceId(
      NextResponse.json({
        message: "Password updated successfully.",
      }),
      traceId,
    );
  } catch (error) {
    logError("Reset password error", error, {
      route: "POST /api/reset-password/[token]",
      traceId,
    });
    return toErrorResponse(error, traceId);
  }
}
