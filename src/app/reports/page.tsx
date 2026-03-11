import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { ReportsPageClient } from "@/src/components/pages/ReportsPageClient";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

export default async function ReportsPage() {
  const { role } = await requireAuthenticatedRoute("/reports");

  return (
    <DashboardLayout currentPath="/reports" role={role} title="Reports">
      <ReportsPageClient />
    </DashboardLayout>
  );
}
