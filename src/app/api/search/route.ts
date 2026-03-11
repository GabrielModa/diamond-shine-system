import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { createSearchServiceFromPrisma } from "../../../modules/search/search.service";

const getService = () =>
  createSearchServiceFromPrisma({
    feedback: prisma.feedback,
    supplyRequest: prisma.supplyRequest,
    user: prisma.user,
  });

export async function GET(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const user = await getActiveSessionUser();
    if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);
    const query = new URL(request.url).searchParams.get("q") ?? "";
    const result = await getService().search({ actorRole: user.role, query });
    return withTraceId(NextResponse.json(result), traceId);
  } catch (error) {
    return withTraceId(NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 400 }), traceId);
  }
}
