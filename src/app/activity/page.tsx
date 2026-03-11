import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { ActivityPageClient } from "@/src/components/pages/ActivityPageClient";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

export default async function ActivityPage() {
  const { role } = await requireAuthenticatedRoute("/activity");

  return (
    <DashboardLayout currentPath="/activity" role={role} title="Activity Feed">
      <ActivityPageClient />
    </DashboardLayout>
  );
}
