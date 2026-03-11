import Link from "next/link";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { requireAuthenticatedRoute } from "@/src/lib/auth";
import { canAccessRoute } from "@/src/lib/permissions";
import { FeedbackChart } from "@/src/components/metrics/FeedbackChart";
import { MetricsCards } from "@/src/components/metrics/MetricsCards";
import { SuppliesChart } from "@/src/components/metrics/SuppliesChart";
import { getDashboardMetrics } from "@/src/modules/dashboard/dashboard.metrics";
import type { AppRoute } from "@/src/types/permissions";
import { prisma } from "@/src/lib/prisma";
import { ActivityTimeline } from "@/src/components/activity/ActivityTimeline";

const CARDS: Array<{
  description: string;
  href: AppRoute;
  title: string;
}> = [
  {
    href: "/users",
    description: "Manage roles and status for platform users.",
    title: "Users",
  },
  {
    href: "/supplies",
    description: "Review supply requests and approvals.",
    title: "Supplies",
  },
  {
    href: "/feedback",
    description: "Track and review employee feedback records.",
    title: "Feedback",
  },
];

async function loadDashboardMetrics(role: "ADMIN" | "SUPERVISOR") {
  return getDashboardMetrics(role);
}

export default async function DashboardPage() {
  const { role } = await requireAuthenticatedRoute("/dashboard");
  const canAccessMetrics = role === "ADMIN" || role === "SUPERVISOR";
  const metrics = canAccessMetrics ? await loadDashboardMetrics(role) : null;
  const visibleCards = CARDS.filter((card) => canAccessRoute(role, card.href));

  const recentActivity = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <DashboardLayout currentPath="/dashboard" role={role} title="Dashboard">
      {metrics ? (
        <>
          <MetricsCards
            averageFeedbackScore={metrics.averageFeedbackScore}
            pendingSupplies={metrics.pendingSupplies}
            totalFeedback={metrics.totalFeedback}
            totalUsers={metrics.totalUsers}
          />
          <section className="mb-6 grid gap-4 lg:grid-cols-2">
            <SuppliesChart data={metrics.suppliesByDepartment} />
            <FeedbackChart data={metrics.feedbackScoreTrend} />
          </section>
        </>
      ) : null}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent Activity</h2>
        <ActivityTimeline items={recentActivity.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))} />
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {visibleCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="text-lg font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{card.description}</p>
          </Link>
        ))}
      </section>
    </DashboardLayout>
  );
}
