import Link from "next/link";
import { headers } from "next/headers";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { requireAuthenticatedRoute } from "@/src/lib/auth";
import { canAccessRoute } from "@/src/lib/permissions";
import { FeedbackChart } from "@/src/components/metrics/FeedbackChart";
import { MetricsCards } from "@/src/components/metrics/MetricsCards";
import { SuppliesChart } from "@/src/components/metrics/SuppliesChart";
import type { AppRoute } from "@/src/types/permissions";

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

type DashboardMetrics = {
  totalUsers: number;
  activeUsers: number;
  pendingSupplies: number;
  approvedSupplies: number;
  rejectedSupplies: number;
  totalFeedback: number;
  averageFeedbackScore: number;
  suppliesByDepartment: Array<{ department: string; count: number }>;
  feedbackScoreTrend: Array<{ date: string; averageScore: number }>;
};

async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host.");
  }

  const response = await fetch(`${protocol}://${host}/api/metrics`, {
    cache: "no-store",
    headers: {
      cookie: requestHeaders.get("cookie") ?? "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load metrics.");
  }

  return (await response.json()) as DashboardMetrics;
}

export default async function DashboardPage() {
  const { role } = await requireAuthenticatedRoute("/dashboard");
  const canAccessMetrics = role === "ADMIN" || role === "SUPERVISOR";
  const metrics = canAccessMetrics ? await getDashboardMetrics() : null;
  const visibleCards = CARDS.filter((card) => canAccessRoute(role, card.href));

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
