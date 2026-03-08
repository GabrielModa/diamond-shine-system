import { headers } from "next/headers";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { CreateSupplyForm } from "@/src/components/forms/CreateSupplyForm";

type SupplyRow = {
  id: string;
  item: string;
  quantity: number;
  department: string;
  status: string;
  requestDate: string;
  requesterId: string;
};

async function getSupplies(): Promise<SupplyRow[]> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host.");
  }

  const response = await fetch(`${protocol}://${host}/api/supplies`, {
    cache: "no-store",
    headers: {
      cookie: requestHeaders.get("cookie") ?? "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load supply requests.");
  }

  return (await response.json()) as SupplyRow[];
}

export default async function SuppliesPage() {
  const supplies = await getSupplies();

  return (
    <DashboardLayout currentPath="/supplies" title="Supplies">
      <CreateSupplyForm />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Item</th>
              <th className="px-4 py-3 font-semibold">Qty</th>
              <th className="px-4 py-3 font-semibold">Department</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Requester</th>
              <th className="px-4 py-3 font-semibold">Request Date</th>
            </tr>
          </thead>
          <tbody>
            {supplies.map((supply) => (
              <tr key={supply.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-800">{supply.item}</td>
                <td className="px-4 py-3 text-slate-600">{supply.quantity}</td>
                <td className="px-4 py-3 text-slate-600">{supply.department}</td>
                <td className="px-4 py-3 text-slate-600">{supply.status}</td>
                <td className="px-4 py-3 text-slate-600">{supply.requesterId}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(supply.requestDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
