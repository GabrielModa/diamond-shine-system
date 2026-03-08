import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { createFeedbackServiceFromPrisma } from "../../../modules/feedback/feedback.service";
import type {
  CreateFeedbackInput,
  UpdateFeedbackInput,
} from "../../../modules/feedback/feedback.types";
import type { UserRole } from "../../../types/user";

function getService() {
  return createFeedbackServiceFromPrisma({
    feedback: prisma.feedback,
  });
}

function toErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

function getRequiredRole(searchParams: URLSearchParams): UserRole {
  const actorRole = searchParams.get("actorRole");
  if (!actorRole) {
    throw new Error("actorRole is required.");
  }
  return actorRole as UserRole;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getService().listFeedback({
      actorRole: getRequiredRole(searchParams),
      employeeId: searchParams.get("employeeId") ?? undefined,
      reviewerId: searchParams.get("reviewerId") ?? undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CreateFeedbackInput;
    const result = await getService().createFeedback(payload);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = (await request.json()) as UpdateFeedbackInput;
    const result = await getService().updateFeedback(payload);
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
