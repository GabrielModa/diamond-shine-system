import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import { createWorkflowInstanceSchema, transitionWorkflowSchema } from "../../../lib/validation/new-modules.schema";
import { createWorkflowServiceFromPrisma } from "../../../modules/workflow/workflow.service";

const getService = () => createWorkflowServiceFromPrisma({ workflowInstance: prisma.workflowInstance });

export async function GET(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const user = await getActiveSessionUser();
    if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);
    const entityId = new URL(request.url).searchParams.get("entityId") ?? undefined;
    return withTraceId(NextResponse.json(await getService().listInstances(entityId)), traceId);
  } catch (error) {
    return withTraceId(NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status: 400 }), traceId);
  }
}

export async function POST(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const user = await getActiveSessionUser();
    if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);
    const payload = validateSchema(createWorkflowInstanceSchema, await request.json());
    return withTraceId(NextResponse.json(await getService().createInstance({ ...payload, actorId: user.id, actorRole: user.role }), { status: 201 }), traceId);
  } catch (error) {
    const status = error instanceof SchemaValidationError ? error.status : 400;
    return withTraceId(NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status }), traceId);
  }
}

export async function PATCH(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const user = await getActiveSessionUser();
    if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);
    const payload = validateSchema(transitionWorkflowSchema, await request.json());
    return withTraceId(NextResponse.json(await getService().transitionStep({ ...payload, actorId: user.id, actorRole: user.role })), traceId);
  } catch (error) {
    const status = error instanceof SchemaValidationError ? error.status : 400;
    return withTraceId(NextResponse.json({ error: error instanceof Error ? error.message : "Unexpected error." }, { status }), traceId);
  }
}
