import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit } from "../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import { registerSchema } from "../../../lib/validation/auth.schema";
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

function getRateLimitResponse(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const result = checkRateLimit({
    key: `register:${ip}`,
    limit: 10,
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

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = getRateLimitResponse(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const payload = validateSchema(registerSchema, await request.json());
    const user = await getService().registerUser(payload);

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
