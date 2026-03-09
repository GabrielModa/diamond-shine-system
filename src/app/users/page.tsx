import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { SubmitButton } from "@/src/components/dashboard/SubmitButton";
import { authOptions } from "@/src/lib/auth";
import type { UserRole } from "@/src/types/user";

type UserRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

async function getUsers(): Promise<UserRow[]> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    throw new Error("Unable to resolve request host.");
  }

  const response = await fetch(`${protocol}://${host}/api/users`, {
    cache: "no-store",
    headers: {
      cookie: requestHeaders.get("cookie") ?? "",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to load users.");
  }

  return (await response.json()) as UserRow[];
}

async function callUsersApi(path: string, method: "POST" | "PATCH", body: Record<string, unknown>) {
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
    throw new Error(payload?.error ?? "Failed to process users action.");
  }
}

async function createUserAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "EMPLOYEE");

  await callUsersApi("/api/users", "POST", {
    email,
    role,
  });
  revalidatePath("/users");
}

async function updateRoleAction(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  await callUsersApi("/api/users", "PATCH", {
    action: "updateRole",
    role,
    userId,
  });
  revalidatePath("/users");
}

async function deactivateUserAction(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "");

  await callUsersApi("/api/users", "PATCH", {
    action: "deactivate",
    userId,
  });
  revalidatePath("/users");
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as UserRole | undefined) ?? "VIEWER";
  const canManageUsers = role === "ADMIN";
  const users = await getUsers();

  return (
    <DashboardLayout currentPath="/users" title="Users">
      <form action={createUserAction} className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Create User</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            name="email"
            type="email"
            required
            placeholder="email@company.com"
            className="rounded border px-3 py-2 text-sm text-slate-900"
          />
          <select name="role" defaultValue="EMPLOYEE" className="rounded border px-3 py-2 text-sm text-slate-900">
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="VIEWER">VIEWER</option>
          </select>
          <SubmitButton idleLabel="Create User" pendingLabel="Creating..." />
        </div>
      </form>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created At</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-800">{user.email}</td>
                <td className="px-4 py-3 text-slate-600">{user.role}</td>
                <td className="px-4 py-3 text-slate-600">{user.status}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {canManageUsers ? (
                    <div className="flex flex-col gap-2">
                      <form action={updateRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded border px-3 py-2 text-sm text-slate-900"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPERVISOR">SUPERVISOR</option>
                          <option value="EMPLOYEE">EMPLOYEE</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                        <SubmitButton idleLabel="Update" pendingLabel="Saving..." />
                      </form>
                      {user.status !== "INACTIVE" ? (
                        <form action={deactivateUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <SubmitButton
                            idleLabel="Deactivate"
                            pendingLabel="Deactivating..."
                            className="rounded bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-60"
                          />
                        </form>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No actions available</span>
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
