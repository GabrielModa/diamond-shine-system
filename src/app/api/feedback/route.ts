import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
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

function toErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

async function getSessionUser(): Promise<{ id: string; role: UserRole } | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: UserRole } | undefined;

  if (!user?.id || !user.role) {
    return null;
  }

  return {
    id: user.id,
    role: user.role,
  };
}

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as CreateFeedbackPayload;
    const result = await getService().createFeedback({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      comments: payload.comments,
      employeeId: payload.employeeId,
      reviewerId: sessionUser.id,
      score: payload.score,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as UpdateFeedbackPayload;
    const result = await getService().updateFeedback({
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      comments: payload.comments,
      feedbackId: payload.feedbackId,
      score: payload.score,
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
