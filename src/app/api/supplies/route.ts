import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { logError, logWarn } from "../../../lib/observability/logger";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { checkRateLimit, getRequestIp } from "../../../lib/security/rateLimit";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import { createSupplySchema, reviewSupplySchema } from "../../../lib/validation/supply.schema";
import { createSuppliesServiceFromPrisma } from "../../../modules/supplies/supplies.service";
import type { ListSupplyRequestsInput } from "../../../modules/supplies/supplies.types";
import type { UserRole } from "../../../types/user";

type ReviewSupplyPayload = { action: "approve" | "reject" | "complete"; requestId: string };
type CreateSupplyPayload = { item: string; quantity: number; department: string; priority: "LOW" | "NORMAL" | "URGENT"; notes?: string };

const getService = () => createSuppliesServiceFromPrisma({ activity: prisma.activity, auditLog: prisma.auditLog, notification: prisma.notification, supplyRequest: prisma.supplyRequest, workflow: prisma.workflowInstance });

function toErrorResponse(error: unknown, traceId: string): NextResponse {
  if (error instanceof SchemaValidationError) return withTraceId(NextResponse.json({ error: error.message }, { status: error.status }), traceId);
  return withTraceId(NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 400 }), traceId);
}

async function getRateLimitResponse(request: NextRequest, traceId: string): Promise<NextResponse | null> {
  const ip = getRequestIp(request.headers);
  const result = await checkRateLimit({ key: `supplies:${ip}` });
  if (result.allowed) return null;
  logWarn("Rate limit exceeded", { ip, key: "supplies", route: "API /api/supplies", traceId });
  return withTraceId(NextResponse.json({ error: "Too many requests. Please try again later." }, { headers: { "Retry-After": String(result.retryAfterSeconds) }, status: 429 }), traceId);
}

async function getSessionUser(): Promise<{ id: string; role: UserRole } | null> {
  const user = await getActiveSessionUser();
  if (!user) return null;
  return { id: user.id, role: user.role };
}

export async function GET(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const rateLimitResponse = await getRateLimitResponse(request, traceId);
    if (rateLimitResponse) return rateLimitResponse;

    const sessionUser = await getSessionUser();
    if (!sessionUser) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);

    const { searchParams } = new URL(request.url);
    const input: ListSupplyRequestsInput = {
      actorRole: sessionUser.role,
      department: searchParams.get("department") ?? undefined,
      period: (searchParams.get("period") as ListSupplyRequestsInput["period"]) ?? "all",
      requesterId: sessionUser.role === "EMPLOYEE" ? sessionUser.id : searchParams.get("requesterId") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as ListSupplyRequestsInput["status"]) ?? "all",
    };

    return withTraceId(NextResponse.json(await getService().listSupplyRequests(input)), traceId);
  } catch (error) {
    logError("Supplies API error", error, { route: "GET /api/supplies", traceId });
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

    const payload = validateSchema<CreateSupplyPayload>(createSupplySchema, await request.json());
    const result = await getService().createSupplyRequest({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      department: payload.department,
      item: payload.item,
      notes: payload.notes,
      priority: payload.priority,
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
    if (rateLimitResponse) return rateLimitResponse;

    const sessionUser = await getSessionUser();
    if (!sessionUser) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);

    const payload = validateSchema<ReviewSupplyPayload>(reviewSupplySchema, await request.json());
    if (payload.action === "approve") return withTraceId(NextResponse.json(await getService().approveRequest({ actorId: sessionUser.id, actorRole: sessionUser.role, requestId: payload.requestId })), traceId);
    if (payload.action === "reject") return withTraceId(NextResponse.json(await getService().rejectRequest({ actorId: sessionUser.id, actorRole: sessionUser.role, requestId: payload.requestId })), traceId);
    if (payload.action === "complete") return withTraceId(NextResponse.json(await getService().completeRequest({ actorId: sessionUser.id, actorRole: sessionUser.role, requestId: payload.requestId })), traceId);
    throw new Error("Invalid supplies action.");
  } catch (error) {
    logError("Supplies API error", error, { route: "PATCH /api/supplies", traceId });
    return toErrorResponse(error, traceId);
  }
}
