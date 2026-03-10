import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { logError, logWarn } from "../../../lib/observability/logger";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit, getRequestIp } from "../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import {
  createSupplySchema,
  reviewSupplySchema,
} from "../../../lib/validation/supply.schema";
import { createSuppliesServiceFromPrisma } from "../../../modules/supplies/supplies.service";
import type { ListSupplyRequestsInput } from "../../../modules/supplies/supplies.types";
import type { UserRole } from "../../../types/user";

type ReviewSupplyPayload = {
  action: "approve" | "reject" | "complete";
  requestId: string;
};

type CreateSupplyPayload = {
  item: string;
  quantity: number;
  department: string;
};

function getService() {
  return createSuppliesServiceFromPrisma({
    activity: prisma.activity,
    auditLog: prisma.auditLog,
    notification: prisma.notification,
    supplyRequest: prisma.supplyRequest,
    workflow: prisma.workflowInstance,
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
    key: `supplies:${ip}`,
  });

  if (result.allowed) {
    return null;
  }

  logWarn("Rate limit exceeded", {
    ip,
    key: "supplies",
    route: "API /api/supplies",
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
    const input: ListSupplyRequestsInput = {
      actorRole: sessionUser.role,
      department: searchParams.get("department") ?? undefined,
    };

    if (sessionUser.role === "EMPLOYEE") {
      input.requesterId = sessionUser.id;
    } else {
      input.requesterId = searchParams.get("requesterId") ?? undefined;
    }

    const result = await getService().listSupplyRequests(input);
    return withTraceId(NextResponse.json(result), traceId);
  } catch (error) {
    logError("Supplies API error", error, { route: "GET /api/supplies", traceId });
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

    const payload = validateSchema<CreateSupplyPayload>(createSupplySchema, await request.json());
    const result = await getService().createSupplyRequest({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      department: payload.department,
      item: payload.item,
      quantity: payload.quantity,
      requesterId: sessionUser.id,
    });
    return withTraceId(NextResponse.json(result, { status: 201 }), traceId);
  } catch (error) {
    logError("Supplies API error", error, { route: "POST /api/supplies", traceId });
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

    const payload = validateSchema<ReviewSupplyPayload>(reviewSupplySchema, await request.json());

    if (payload.action === "approve") {
      const result = await getService().approveRequest({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        requestId: payload.requestId,
      });
      return withTraceId(NextResponse.json(result), traceId);
    }

    if (payload.action === "reject") {
      const result = await getService().rejectRequest({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        requestId: payload.requestId,
      });
      return withTraceId(NextResponse.json(result), traceId);
    }

    if (payload.action === "complete") {
      const result = await getService().completeRequest({
        actorId: sessionUser.id,
        actorRole: sessionUser.role,
        requestId: payload.requestId,
      });
      return withTraceId(NextResponse.json(result), traceId);
    }

    throw new Error("Invalid supplies action.");
  } catch (error) {
    logError("Supplies API error", error, { route: "PATCH /api/supplies", traceId });
    return toErrorResponse(error, traceId);
  }
}
