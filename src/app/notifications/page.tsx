import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { NotificationsPageClient } from "@/src/components/pages/NotificationsPageClient";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

export default async function NotificationsPage() {
  const { role } = await requireAuthenticatedRoute("/notifications");

  return (
    <DashboardLayout currentPath="/notifications" role={role} title="Notifications">
      <NotificationsPageClient />
    </DashboardLayout>
  );
}
