import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { checkRateLimit } from "../../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../../lib/security/validate";
import { resetPasswordSchema } from "../../../../lib/validation/auth.schema";
import { createAuthenticationServiceFromPrisma } from "../../../../modules/auth/auth.service";

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateLimit = checkRateLimit({
      key: `reset-password:${ip}`,
      limit: 10,
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

    const { token } = await context.params;
    const payload = validateSchema(resetPasswordSchema, await request.json());

    await getService().resetPassword({
      password: payload.password,
      token,
    });

    return NextResponse.json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
