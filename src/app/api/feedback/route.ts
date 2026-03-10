import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { logError, logWarn } from "../../../lib/observability/logger";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit, getRequestIp } from "../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import {
  createFeedbackSchema,
  updateFeedbackSchema,
} from "../../../lib/validation/feedback.schema";
import { createFeedbackServiceFromPrisma } from "../../../modules/feedback/feedback.service";
import type {
  ListFeedbackInput,
} from "../../../modules/feedback/feedback.types";
import type { UserRole } from "../../../types/user";

type CreateFeedbackPayload = {
  employeeId: string;
  score: number;
  comments: string;
};

type UpdateFeedbackPayload = {
  feedbackId: string;
  score: number;
  comments: string;
};

function getService() {
  return createFeedbackServiceFromPrisma({
    auditLog: prisma.auditLog,
    feedback: prisma.feedback,
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
  request: NextRequest,
  traceId: string,
): Promise<NextResponse | null> {
  const ip = getRequestIp(request.headers);
  const result = await checkRateLimit({
    key: `feedback:${ip}`,
  });

  if (result.allowed) {
    return null;
  }

  logWarn("Rate limit exceeded", {
    ip,
    key: "feedback",
    route: "API /api/feedback",
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

    const { searchParams } = new URL(request.url);
    const input: ListFeedbackInput = {
      actorRole: sessionUser.role,
      reviewerId: searchParams.get("reviewerId") ?? undefined,
    };

    if (sessionUser.role === "EMPLOYEE") {
      input.employeeId = sessionUser.id;
    } else {
      input.employeeId = searchParams.get("employeeId") ?? undefined;
    }

    const result = await getService().listFeedback(input);
    return withTraceId(NextResponse.json(result), traceId);
  } catch (error) {
    logError("Feedback API error", error, { route: "GET /api/feedback", traceId });
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

    const payload = validateSchema<CreateFeedbackPayload>(createFeedbackSchema, await request.json());
    const result = await getService().createFeedback({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      comments: payload.comments,
      employeeId: payload.employeeId,
      reviewerId: sessionUser.id,
      score: payload.score,
    });
    return withTraceId(NextResponse.json(result, { status: 201 }), traceId);
  } catch (error) {
    logError("Feedback API error", error, { route: "POST /api/feedback", traceId });
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

    const payload = validateSchema<UpdateFeedbackPayload>(updateFeedbackSchema, await request.json());
    const result = await getService().updateFeedback({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      comments: payload.comments,
      feedbackId: payload.feedbackId,
      score: payload.score,
    });
    return withTraceId(NextResponse.json(result), traceId);
  } catch (error) {
    logError("Feedback API error", error, { route: "PATCH /api/feedback", traceId });
    return toErrorResponse(error, traceId);
  }
}
