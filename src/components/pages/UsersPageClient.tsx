"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Table, TableContainer } from "@/src/components/ui/Table";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { getStatusTone, readApiError } from "./page-state.utils";

type UserRole = "ADMIN" | "SUPERVISOR" | "EMPLOYEE" | "VIEWER";
type UserStatus = "ACTIVE" | "INACTIVE";

type UserRow = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export function UsersPageClient({ role }: { role: UserRole }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("EMPLOYEE");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canManageUsers = role === "ADMIN";

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to load users."));
      }

      const data = (await response.json()) as UserRow[];
      setUsers(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: newRole }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to create user."));
      }

      setEmail("");
      setNewRole("EMPLOYEE");
      await loadUsers();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const patchUser = async (payload: Record<string, string>) => {
    setError("");
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError(await readApiError(response, "Failed to update user."));
      return;
    }

    await loadUsers();
  };

  return (
    <div className="space-y-5">
      {canManageUsers ? (
        <form onSubmit={createUser} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="email@company.com" className="rounded border px-3 py-2 text-sm" />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="rounded border px-3 py-2 text-sm">
            <option value="ADMIN">ADMIN</option><option value="SUPERVISOR">SUPERVISOR</option><option value="EMPLOYEE">EMPLOYEE</option><option value="VIEWER">VIEWER</option>
          </select>
          <button disabled={submitting} className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60">{submitting ? "Creating..." : "Create User"}</button>
        </form>
      ) : null}

      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading users...</p> : null}
      {!loading && !users.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No users found.</p> : null}

      {!loading && users.length ? (
        <TableContainer>
          <Table>
            <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-2">Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2">{user.email}</td>
                  <td>{user.role}</td>
                  <td><StatusBadge tone={getStatusTone(user.status)}>{user.status}</StatusBadge></td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">
                    {canManageUsers ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select defaultValue={user.role} onChange={(e) => void patchUser({ action: "updateRole", role: e.target.value, userId: user.id })} className="rounded border px-2 py-1 text-xs">
                          <option value="ADMIN">ADMIN</option><option value="SUPERVISOR">SUPERVISOR</option><option value="EMPLOYEE">EMPLOYEE</option><option value="VIEWER">VIEWER</option>
                        </select>
                        {user.status === "ACTIVE" ? (
                          <button type="button" onClick={() => void patchUser({ action: "deactivate", userId: user.id })} className="rounded bg-rose-700 px-2 py-1 text-xs text-white">Deactivate</button>
                        ) : (
                          <button type="button" onClick={() => void patchUser({ action: "activate", userId: user.id })} className="rounded bg-emerald-700 px-2 py-1 text-xs text-white">Activate</button>
                        )}
                      </div>
                    ) : <span className="text-xs text-slate-500">No actions</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : null}
    </div>
  );
}
