import type { UserRole } from "../../types/user";

export type DashboardMetrics = {
  activeUsers: number;
  approvedSupplies: number;
  averageFeedbackScore: number;
  feedbackScoreTrend: Array<{ averageScore: number; date: string }>;
  pendingSupplies: number;
  rejectedSupplies: number;
  suppliesByDepartment: Array<{ count: number; department: string }>;
  totalFeedback: number;
  totalUsers: number;
};

type DashboardServiceDeps = {
  feedback: {
    aggregate: (args: {
      _avg: {
        score: true;
      };
      _count: {
        _all: true;
      };
    }) => Promise<{
      _avg: {
        score: number | null;
      };
      _count: {
        _all: number;
      };
    }>;
    findMany: (args: {
      orderBy: {
        date: "asc";
      };
      select: {
        date: true;
        score: true;
      };
    }) => Promise<Array<{ date: Date; score: number }>>;
  };
  supplyRequest: {
    count: (args: {
      where: {
        status: "PENDING" | "APPROVED" | "REJECTED";
      };
    }) => Promise<number>;
    findMany: (args: {
      select: {
        department: true;
      };
    }) => Promise<Array<{ department: string }>>;
  };
  user: {
    count: (args?: {
      where?: {
        status: "ACTIVE";
      };
    }) => Promise<number>;
  };
};

function buildSuppliesByDepartment(rows: Array<{ department: string }>) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.department, (counts.get(row.department) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([department, count]) => ({ count, department }))
    .sort((a, b) => b.count - a.count);
}

function buildFeedbackTrend(rows: Array<{ date: Date; score: number }>) {
  const grouped = new Map<string, { count: number; total: number }>();

  for (const row of rows) {
    const key = row.date.toISOString().slice(0, 10);
    const current = grouped.get(key) ?? { count: 0, total: 0 };
    grouped.set(key, {
      count: current.count + 1,
      total: current.total + row.score,
    });
  }

  return [...grouped.entries()]
    .map(([date, value]) => ({
      averageScore: Number((value.total / value.count).toFixed(2)),
      date,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function createDashboardService(deps: DashboardServiceDeps) {
  return {
    async getMetrics(actorRole: UserRole): Promise<DashboardMetrics> {
      if (actorRole !== "ADMIN" && actorRole !== "SUPERVISOR") {
        throw new Error("Only admins and supervisors can view dashboard metrics.");
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
        deps.user.count(),
        deps.user.count({
          where: {
            status: "ACTIVE",
          },
        }),
        deps.supplyRequest.count({
          where: {
            status: "PENDING",
          },
        }),
        deps.supplyRequest.count({
          where: {
            status: "APPROVED",
          },
        }),
        deps.supplyRequest.count({
          where: {
            status: "REJECTED",
          },
        }),
        deps.feedback.aggregate({
          _avg: {
            score: true,
          },
          _count: {
            _all: true,
          },
        }),
        deps.supplyRequest.findMany({
          select: {
            department: true,
          },
        }),
        deps.feedback.findMany({
          orderBy: {
            date: "asc",
          },
          select: {
            date: true,
            score: true,
          },
        }),
      ]);

      return {
        activeUsers,
        approvedSupplies,
        averageFeedbackScore: Number((feedbackAggregate._avg.score ?? 0).toFixed(2)),
        feedbackScoreTrend: buildFeedbackTrend(feedbackRows),
        pendingSupplies,
        rejectedSupplies,
        suppliesByDepartment: buildSuppliesByDepartment(suppliesRows),
        totalFeedback: feedbackAggregate._count._all,
        totalUsers,
      };
    },
  };
}

export function createDashboardServiceFromPrisma(prisma: DashboardServiceDeps) {
  return createDashboardService(prisma);
}
