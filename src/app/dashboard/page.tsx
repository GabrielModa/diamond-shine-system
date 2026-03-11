import Link from "next/link";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { ActivityTimeline } from "@/src/components/activity/ActivityTimeline";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { requireAuthenticatedRoute } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { getDashboardMetrics } from "@/src/modules/dashboard/dashboard.metrics";

export default async function DashboardPage() {
  const { role } = await requireAuthenticatedRoute("/dashboard");
  const canSeeOperationalMetrics = role === "ADMIN" || role === "SUPERVISOR";

  const metrics = canSeeOperationalMetrics ? await getDashboardMetrics(role) : null;

  const recentActivity = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const quickActions = [
    { href: "/supplies", label: "Supplies", description: "Create and track requests." },
    { href: "/feedback", label: "Feedback", description: "Review performance notes." },
    { href: "/files", label: "Files", description: "Upload and share docs." },
    { href: "/activity", label: "Activity", description: "View workflow timeline." },
  ];

  return (
    <DashboardLayout currentPath="/dashboard" role={role} title="Operations Dashboard">
      <section className="mb-5 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending supplies</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics?.pendingSupplies ?? "-"}</p>
          <StatusBadge tone="warning">Awaiting review</StatusBadge>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feedback summary</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{metrics?.totalFeedback ?? 0}</p>
          <p className="mt-1 text-xs text-slate-600">Average score {metrics?.averageFeedbackScore ?? 0}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Team visibility</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{canSeeOperationalMetrics ? "Supervisor view" : "Employee view"}</p>
          <p className="mt-1 text-xs text-slate-600">Focus on daily actions and approvals.</p>
        </article>
      </section>

      <section className="mb-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">{action.label}</p>
              <p className="mt-1 text-sm text-slate-600">{action.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Recent activity</h2>
        <ActivityTimeline
          items={recentActivity.map((item: { createdAt: Date } & Record<string, unknown>) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </section>
    </DashboardLayout>
  );
}
