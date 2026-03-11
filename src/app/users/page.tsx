import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { UsersPageClient } from "@/src/components/pages/UsersPageClient";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

export default async function UsersPage() {
  const { role } = await requireAuthenticatedRoute("/users");

  return (
    <DashboardLayout currentPath="/users" role={role} title="Users">
      <UsersPageClient role={role} />
    </DashboardLayout>
  );
}
