import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { logError } from "../../../lib/observability/logger";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { createDashboardServiceFromPrisma } from "../../../modules/dashboard/dashboard.service";
import type { UserRole } from "../../../types/user";

function toErrorResponse(error: unknown, traceId: string): NextResponse {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return withTraceId(NextResponse.json({ error: message }, { status: 400 }), traceId);
}

async function getSessionUser(): Promise<{ role: UserRole } | null> {
  const sessionUser = await getActiveSessionUser();
  if (!sessionUser) {
    return null;
  }

  return {
    role: sessionUser.role,
  };
}

export async function GET(request?: NextRequest) {
  const traceId = getTraceId(request?.headers);
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return withTraceId(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        traceId,
      );
    }

    const metrics = await createDashboardServiceFromPrisma({
      feedback: prisma.feedback,
      supplyRequest: prisma.supplyRequest,
      user: prisma.user,
    }).getMetrics(sessionUser.role);

    return withTraceId(NextResponse.json(metrics), traceId);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Only admins and supervisors can view dashboard metrics."
    ) {
      return withTraceId(
        NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        traceId,
      );
    }

    logError("Metrics API error", error, { route: "GET /api/metrics", traceId });
    return toErrorResponse(error, traceId);
  }
}
