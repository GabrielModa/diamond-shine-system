import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { requireAuthenticatedRoute } from "@/src/lib/auth";
import { FilesPageClient } from "@/src/components/pages/FilesPageClient";

export default async function FilesPage() {
  const { role } = await requireAuthenticatedRoute("/files");

  return (
    <DashboardLayout currentPath="/files" role={role} title="Files">
      <FilesPageClient />
    </DashboardLayout>
  );
}
