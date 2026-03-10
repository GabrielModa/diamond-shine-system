import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit } from "../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import { forgotPasswordSchema } from "../../../lib/validation/auth.schema";
import { createAuthenticationServiceFromPrisma } from "../../../modules/auth/auth.service";

function getService() {
  return createAuthenticationServiceFromPrisma({
    user: prisma.user,
    verificationToken: prisma.verificationToken,
  });
}

function toErrorResponse(error: unknown) {
  if (error instanceof SchemaValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

function getBaseUrl(request: NextRequest) {
  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateLimit = checkRateLimit({
      key: `password-reset:${ip}`,
      limit: 5,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
          status: 429,
        },
      );
    }

    const payload = validateSchema(forgotPasswordSchema, await request.json());

    await getService().requestPasswordReset({
      baseUrl: getBaseUrl(request),
      email: payload.email,
    });

    return NextResponse.json({
      message: "If the account exists, a password reset link has been generated.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
