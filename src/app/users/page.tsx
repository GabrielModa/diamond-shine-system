import { revalidatePath } from "next/cache";
import { DashboardLayout } from "@/src/components/dashboard/DashboardLayout";
import { SubmitButton } from "@/src/components/dashboard/SubmitButton";
import { getActiveSessionUser, requireAuthenticatedRoute } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import { createUsersServiceFromPrisma } from "@/src/modules/users/users.service";

type UserRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
};

function getUsersService() {
  return createUsersServiceFromPrisma({
    auditLog: prisma.auditLog,
    session: prisma.session,
    user: prisma.user,
  });
}

async function getUsers(): Promise<UserRow[]> {
  const users = await getUsersService().listUsers();
  return users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));
}

async function requireActionUser() {
  const sessionUser = await getActiveSessionUser();
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }
  return sessionUser;
}

async function createUserAction(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "EMPLOYEE");
  const sessionUser = await requireActionUser();

  await getUsersService().createUser({
    actorId: sessionUser.id,
    email,
    role: role as "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER",
  });
  revalidatePath("/users");
}

async function updateRoleAction(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  const sessionUser = await requireActionUser();

  await getUsersService().updateUserRole({
    actorId: sessionUser.id,
    actorRole: sessionUser.role,
    role: role as "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER",
    userId,
  });
  revalidatePath("/users");
}

async function deactivateUserAction(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "");
  const sessionUser = await requireActionUser();

  await getUsersService().deactivateUser({
    actorId: sessionUser.id,
    actorRole: sessionUser.role,
    userId,
  });
  revalidatePath("/users");
}

async function activateUserAction(formData: FormData) {
  "use server";

  const userId = String(formData.get("userId") ?? "");
  const sessionUser = await requireActionUser();

  await getUsersService().activateUser({
    actorId: sessionUser.id,
    actorRole: sessionUser.role,
    userId,
  });
  revalidatePath("/users");
}

export default async function UsersPage() {
  const { role } = await requireAuthenticatedRoute("/users");
  const canManageUsers = role === "ADMIN";
  const users = await getUsers();

  return (
    <DashboardLayout currentPath="/users" role={role} title="Users">
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
                      ) : (
                        <form action={activateUserAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <SubmitButton
                            idleLabel="Activate"
                            pendingLabel="Activating..."
                            className="rounded bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-60"
                          />
                        </form>
                      )}
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
