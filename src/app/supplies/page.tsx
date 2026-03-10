import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { SubmitButton } from "@/src/components/dashboard/SubmitButton";
import { requireAuthenticatedRoute } from "@/src/lib/auth";

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

async function callSuppliesApi(path: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
  "use server";

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host.");
  }

  const response = await fetch(`${protocol}://${host}${path}`, {
    body: JSON.stringify(body),
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      cookie: requestHeaders.get("cookie") ?? "",
    },
    method,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to process supplies action.");
  }
}

async function createSupplyAction(formData: FormData) {
  "use server";

  const item = String(formData.get("item") ?? "");
  const quantity = Number(formData.get("quantity") ?? 0);
  const department = String(formData.get("department") ?? "");

  await callSuppliesApi("/api/supplies", "POST", {
    department,
    item,
    quantity,
  });
  revalidatePath("/supplies");
}

async function approveSupplyAction(formData: FormData) {
  "use server";

  const requestId = String(formData.get("requestId") ?? "");

  await callSuppliesApi("/api/supplies", "PATCH", {
    action: "approve",
    requestId,
  });
  revalidatePath("/supplies");
}

async function rejectSupplyAction(formData: FormData) {
  "use server";

  const requestId = String(formData.get("requestId") ?? "");

  await callSuppliesApi("/api/supplies", "PATCH", {
    action: "reject",
    requestId,
  });
  revalidatePath("/supplies");
}

async function completeSupplyAction(formData: FormData) {
  "use server";

  const requestId = String(formData.get("requestId") ?? "");

  await callSuppliesApi("/api/supplies", "PATCH", {
    action: "complete",
    requestId,
  });
  revalidatePath("/supplies");
}

export default async function SuppliesPage() {
  const { role } = await requireAuthenticatedRoute("/supplies");
  const canCreate = role === "ADMIN" || role === "EMPLOYEE";
  const canReview = role === "ADMIN" || role === "SUPERVISOR";
  const supplies = await getSupplies();

  return (
    <DashboardLayout currentPath="/supplies" role={role} title="Supplies">
      {canCreate ? (
        <form
          action={createSupplyAction}
          className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Create Supply Request</h2>
          <div className="grid gap-3 md:grid-cols-4">
            <input
              name="item"
              type="text"
              required
              placeholder="Item"
              className="rounded border px-3 py-2 text-sm text-slate-900"
            />
            <input
              name="quantity"
              type="number"
              min={1}
              required
              defaultValue={1}
              className="rounded border px-3 py-2 text-sm text-slate-900"
            />
            <input
              name="department"
              type="text"
              required
              placeholder="Department"
              className="rounded border px-3 py-2 text-sm text-slate-900"
            />
            <SubmitButton idleLabel="Create Request" pendingLabel="Submitting..." />
          </div>
        </form>
      ) : null}
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
              <th className="px-4 py-3 font-semibold">Actions</th>
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
                <td className="px-4 py-3 text-slate-600">
                  {canReview && supply.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <form action={approveSupplyAction}>
                        <input type="hidden" name="requestId" value={supply.id} />
                        <SubmitButton idleLabel="Approve" pendingLabel="Approving..." />
                      </form>
                      <form action={rejectSupplyAction}>
                        <input type="hidden" name="requestId" value={supply.id} />
                        <SubmitButton
                          idleLabel="Reject"
                          pendingLabel="Rejecting..."
                          className="rounded bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-60"
                        />
                      </form>
                    </div>
                  ) : canReview && supply.status === "APPROVED" ? (
                    <form action={completeSupplyAction}>
                      <input type="hidden" name="requestId" value={supply.id} />
                      <SubmitButton idleLabel="Complete" pendingLabel="Completing..." />
                    </form>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
