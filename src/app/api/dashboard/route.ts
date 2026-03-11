import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { logError } from "../../../lib/observability/logger";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { createDashboardServiceFromPrisma } from "../../../modules/dashboard/dashboard.service";

export async function GET(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const user = await getActiveSessionUser();
    if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);
    const metrics = await createDashboardServiceFromPrisma({ feedback: prisma.feedback, supplyRequest: prisma.supplyRequest, user: prisma.user }).getMetrics(user.role);
    return withTraceId(NextResponse.json(metrics), traceId);
  } catch (error) {
    logError("Dashboard API error", error, { route: "GET /api/dashboard", traceId });
    return withTraceId(NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 400 }), traceId);
  }
}
