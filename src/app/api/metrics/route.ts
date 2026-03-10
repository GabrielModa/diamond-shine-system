import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { createDashboardServiceFromPrisma } from "../../../modules/dashboard/dashboard.service";
import type { UserRole } from "../../../types/user";

function toErrorResponse(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  return NextResponse.json({ error: message }, { status: 400 });
}

async function getSessionUser(): Promise<{ role: UserRole } | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { role?: UserRole } | undefined;

  if (!user?.role) {
    return null;
  }

  return {
    role: user.role,
  };
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const metrics = await createDashboardServiceFromPrisma({
      feedback: prisma.feedback,
      supplyRequest: prisma.supplyRequest,
      user: prisma.user,
    }).getMetrics(sessionUser.role);

    return NextResponse.json(metrics);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Only admins and supervisors can view dashboard metrics."
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return toErrorResponse(error);
  }
}
