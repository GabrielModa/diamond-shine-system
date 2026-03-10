import { NextRequest, NextResponse } from "next/server";
import { getActiveSessionUser } from "../../../lib/auth";
import { withTraceId } from "../../../lib/observability/http";
import { getTraceId } from "../../../lib/observability/trace";
import { prisma } from "../../../lib/prisma";
import { SchemaValidationError, validateSchema } from "../../../lib/security/validate";
import { recordActivitySchema } from "../../../lib/validation/new-modules.schema";
import { createActivityServiceFromPrisma } from "../../../modules/activity/activity.service";

const getService = () => createActivityServiceFromPrisma({ activity: prisma.activity });

const toErrorResponse = (error: unknown, traceId: string) =>
  withTraceId(
    NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      { status: error instanceof SchemaValidationError ? error.status : 400 },
    ),
    traceId,
  );

export async function GET(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const user = await getActiveSessionUser();
    if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);
    return withTraceId(NextResponse.json(await getService().listFeed({ actorId: user.id, actorRole: user.role })), traceId);
  } catch (error) {
    return toErrorResponse(error, traceId);
  }
}

export async function POST(request: NextRequest) {
  const traceId = getTraceId(request.headers);
  try {
    const user = await getActiveSessionUser();
    if (!user) return withTraceId(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), traceId);
    const payload = validateSchema(recordActivitySchema, await request.json());
    return withTraceId(
      NextResponse.json(
        await getService().record({ ...payload, actorId: user.id, actorRole: user.role }),
        { status: 201 },
      ),
      traceId,
    );
  } catch (error) {
    return toErrorResponse(error, traceId);
  }
}
