import type { UserRole } from "../../types/user";

export type DashboardMetrics = {
  totalRequests: number;
  pending: number;
  emailSent: number;
  completed: number;
  priorityCounters: { low: number; normal: number; urgent: number };
  mostRequestedProduct: string | null;
  recentRequests: Array<{ id: string; item: string; status: string; priority: string; requestDate: Date }>;
  totalUsers: number;
  totalFeedback: number;
  averageFeedbackScore: number;
  pendingSupplies: number;
  suppliesByDepartment: Array<{ count: number; department: string }>;
  feedbackScoreTrend: Array<{ averageScore: number; date: string }>;
};

type DashboardServiceDeps = {
  feedback: {
    aggregate: (args: { _avg: { score: true }; _count: { _all: true } }) => Promise<{ _avg: { score: number | null }; _count: { _all: number } }>;
    findMany: (args: { orderBy: { date: "asc" }; select: { date: true; score: true } }) => Promise<Array<{ date: Date; score: number }>>;
  };
  supplyRequest: {
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
    findMany: (args: { select: Record<string, boolean>; where?: Record<string, unknown>; orderBy?: { requestDate: "desc" }; take?: number }) => Promise<Array<Record<string, unknown>>>;
    groupBy: (args: { by: ["item"]; _count: { item: true }; orderBy: { _count: { item: "desc" } }; take: number }) => Promise<Array<{ item: string; _count: { item: number } }>>;
  };
  user: { count: (args?: { where?: { status: "ACTIVE" } }) => Promise<number> };
};

const buildSuppliesByDepartment = (rows: Array<{ department: string }>) => [...rows.reduce((m, r) => m.set(r.department, (m.get(r.department) ?? 0) + 1), new Map<string, number>()).entries()].map(([department, count]) => ({ count, department })).sort((a, b) => b.count - a.count);
const buildFeedbackTrend = (rows: Array<{ date: Date; score: number }>) => [...rows.reduce((m, r) => { const key = r.date.toISOString().slice(0, 10); const prev = m.get(key) ?? { count: 0, total: 0 }; m.set(key, { count: prev.count + 1, total: prev.total + r.score }); return m; }, new Map<string, { count: number; total: number }>()).entries()].map(([date, v]) => ({ averageScore: Number((v.total / v.count).toFixed(2)), date })).sort((a, b) => a.date.localeCompare(b.date));

export function createDashboardService(deps: DashboardServiceDeps) {
  return {
    async getMetrics(actorRole: UserRole): Promise<DashboardMetrics> {
      if (actorRole !== "ADMIN" && actorRole !== "SUPERVISOR") throw new Error("Only admins and supervisors can view dashboard metrics.");

      const [totalUsers, pending, emailSent, completed, totalRequests, feedbackAggregate, suppliesRowsRaw, feedbackRows, priorityRowsRaw, mostRequested, recentRequestsRaw] = await Promise.all([
        deps.user.count(),
        deps.supplyRequest.count({ where: { status: "PENDING" } }),
        deps.supplyRequest.count({ where: { status: "EMAIL_SENT" } }),
        deps.supplyRequest.count({ where: { status: "COMPLETED" } }),
        deps.supplyRequest.count(),
        deps.feedback.aggregate({ _avg: { score: true }, _count: { _all: true } }),
        deps.supplyRequest.findMany({ select: { department: true } }),
        deps.feedback.findMany({ orderBy: { date: "asc" }, select: { date: true, score: true } }),
        deps.supplyRequest.findMany({ select: { priority: true } }),
        deps.supplyRequest.groupBy({ by: ["item"], _count: { item: true }, orderBy: { _count: { item: "desc" } }, take: 1 }),
        deps.supplyRequest.findMany({ orderBy: { requestDate: "desc" }, select: { id: true, item: true, priority: true, requestDate: true, status: true }, take: 20 }),
      ]);

      const priorities = { low: 0, normal: 0, urgent: 0 };
      for (const row of priorityRowsRaw as Array<{ priority: string }>) {
        if (row.priority === "LOW") priorities.low += 1;
        if (row.priority === "NORMAL") priorities.normal += 1;
        if (row.priority === "URGENT") priorities.urgent += 1;
      }

      return {
        averageFeedbackScore: Number((feedbackAggregate._avg.score ?? 0).toFixed(2)),
        completed,
        emailSent,
        feedbackScoreTrend: buildFeedbackTrend(feedbackRows),
        mostRequestedProduct: mostRequested[0]?.item ?? null,
        pending,
        pendingSupplies: pending,
        priorityCounters: priorities,
        recentRequests: recentRequestsRaw as DashboardMetrics["recentRequests"],
        suppliesByDepartment: buildSuppliesByDepartment(suppliesRowsRaw as Array<{ department: string }>),
        totalFeedback: feedbackAggregate._count._all,
        totalRequests,
        totalUsers,
      };
    },
  };
}

export function createDashboardServiceFromPrisma(prisma: DashboardServiceDeps) {
  return createDashboardService(prisma);
}
