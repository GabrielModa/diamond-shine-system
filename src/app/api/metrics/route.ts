import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import type { UserRole } from "../../../types/user";

type SuppliesByDepartmentPoint = {
  department: string;
  count: number;
};

type FeedbackTrendPoint = {
  date: string;
  averageScore: number;
};

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

function buildSuppliesByDepartment(
  rows: Array<{ department: string }>,
): SuppliesByDepartmentPoint[] {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.department, (counts.get(row.department) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([department, count]) => ({ count, department }))
    .sort((a, b) => b.count - a.count);
}

function buildFeedbackTrend(rows: Array<{ date: Date; score: number }>): FeedbackTrendPoint[] {
  const grouped = new Map<string, { total: number; count: number }>();

  for (const row of rows) {
    const dateKey = row.date.toISOString().slice(0, 10);
    const current = grouped.get(dateKey) ?? { count: 0, total: 0 };
    grouped.set(dateKey, {
      count: current.count + 1,
      total: current.total + row.score,
    });
  }

  return [...grouped.entries()]
    .map(([date, data]) => ({
      averageScore: Number((data.total / data.count).toFixed(2)),
      date,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (sessionUser.role !== "ADMIN" && sessionUser.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      totalUsers,
      activeUsers,
      pendingSupplies,
      approvedSupplies,
      rejectedSupplies,
      feedbackAggregate,
      suppliesRows,
      feedbackRows,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          role: {
            not: "VIEWER",
          },
        },
      }),
      prisma.supplyRequest.count({
        where: {
          status: "PENDING",
        },
      }),
      prisma.supplyRequest.count({
        where: {
          status: "APPROVED",
        },
      }),
      prisma.supplyRequest.count({
        where: {
          status: "REJECTED",
        },
      }),
      prisma.feedback.aggregate({
        _avg: {
          score: true,
        },
        _count: {
          _all: true,
        },
      }),
      prisma.supplyRequest.findMany({
        select: {
          department: true,
        },
      }),
      prisma.feedback.findMany({
        orderBy: {
          date: "asc",
        },
        select: {
          date: true,
          score: true,
        },
      }),
    ]);

    return NextResponse.json({
      activeUsers,
      approvedSupplies,
      averageFeedbackScore: Number((feedbackAggregate._avg.score ?? 0).toFixed(2)),
      feedbackScoreTrend: buildFeedbackTrend(feedbackRows),
      pendingSupplies,
      rejectedSupplies,
      suppliesByDepartment: buildSuppliesByDepartment(suppliesRows),
      totalFeedback: feedbackAggregate._count._all,
      totalUsers,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
