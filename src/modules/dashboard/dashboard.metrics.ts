import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "../../lib/prisma";
import type { UserRole } from "../../types/user";
import { createDashboardServiceFromPrisma } from "./dashboard.service";
import type { DashboardMetrics } from "./dashboard.service";

const DEFAULT_REVALIDATE_SECONDS = 60;

function parseRevalidateSeconds(): number | false {
  const raw = process.env.DASHBOARD_METRICS_REVALIDATE_SECONDS;
  if (!raw) {
    return DEFAULT_REVALIDATE_SECONDS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return false;
  }

  return parsed;
}

const getMetrics = cache(async (role: UserRole) => {
  const service = createDashboardServiceFromPrisma({
    feedback: prisma.feedback,
    supplyRequest: prisma.supplyRequest,
    user: prisma.user,
  });

  return service.getMetrics(role);
});

const cachedMetrics = unstable_cache(
  async (role: UserRole) => getMetrics(role),
  ["dashboard-metrics"],
  {
    revalidate: parseRevalidateSeconds(),
  },
);

export async function getDashboardMetrics(
  role: UserRole,
  options?: { fresh?: boolean },
): Promise<DashboardMetrics> {
  if (options?.fresh) {
    return getMetrics(role);
  }

  return cachedMetrics(role);
}
