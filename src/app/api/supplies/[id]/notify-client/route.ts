import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../../../lib/auth";
import { withTraceId } from "../../../../../lib/observability/http";
import { getTraceId } from "../../../../../lib/observability/trace";
import { prisma } from "../../../../../lib/prisma";
import { validateSchema } from "../../../../../lib/security/validate";
import { notifyClientSchema } from "../../../../../lib/validation/supply.schema";
import { createSuppliesServiceFromPrisma } from "../../../../../modules/supplies/supplies.service";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const traceId = getTraceId(request.headers);
  const user = await getActiveSessionUser();
  if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);

  const { id } = await context.params;
  const payload = validateSchema(notifyClientSchema, await request.json());

  const result = await createSuppliesServiceFromPrisma({
    activity: prisma.activity,
    auditLog: prisma.auditLog,
    notification: prisma.notification,
    supplyRequest: prisma.supplyRequest,
    workflow: prisma.workflowInstance,
  }).notifyClient({
    actorId: user.id,
    actorRole: user.role,
    clientEmail: payload.clientEmail,
    requestId: id,
  });

  return withTraceId(NextResponse.json(result), traceId);
}
