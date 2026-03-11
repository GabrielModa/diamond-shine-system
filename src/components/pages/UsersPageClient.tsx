"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
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

const ROLES: UserRole[] = ["ADMIN", "SUPERVISOR", "EMPLOYEE", "VIEWER"];

export function UsersPageClient({ role }: { role: UserRole }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("EMPLOYEE");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<UserRow | null>(null);

  const canManageUsers = role === "ADMIN";
  const totalActive = useMemo(() => users.filter((user) => user.status === "ACTIVE").length, [users]);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      if (!response.ok) throw new Error(await readApiError(response, "Failed to load users."));
      setUsers((await response.json()) as UserRow[]);
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
      if (!response.ok) throw new Error(await readApiError(response, "Failed to create user."));

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
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={String(users.length)} />
        <StatCard label="Active users" value={String(totalActive)} />
        <StatCard label="Inactive users" value={String(users.length - totalActive)} />
        <StatCard label="Your scope" value={canManageUsers ? "Admin" : "Read only"} />
      </section>

      {canManageUsers ? (
        <form onSubmit={createUser} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="email@company.com" className="rounded border px-3 py-2 text-sm" />
          <select value={newRole} onChange={(event) => setNewRole(event.target.value as UserRole)} className="rounded border px-3 py-2 text-sm">
            {ROLES.map((roleOption) => (
              <option key={roleOption} value={roleOption}>{roleOption}</option>
            ))}
          </select>
          <button disabled={submitting} className="rounded bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-60">{submitting ? "Creating..." : "Create User"}</button>
        </form>
      ) : null}

      {error ? <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : null}
      {loading ? <p className="rounded-xl bg-white p-4 text-sm text-slate-500">Loading users...</p> : null}
      {!loading && !users.length ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No users found.</p> : null}

      {!loading && users.length ? (
        <>
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <article key={user.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                <p className="mt-1 text-xs text-slate-600">{user.role} · {new Date(user.createdAt).toLocaleDateString()}</p>
                <div className="mt-2"><StatusBadge tone={getStatusTone(user.status)}>{user.status}</StatusBadge></div>
                {canManageUsers ? (
                  <button type="button" onClick={() => setEditing(user)} className="mt-3 rounded bg-slate-900 px-3 py-1.5 text-xs text-white">Manage</button>
                ) : null}
              </article>
            ))}
          </div>

          <div className="hidden md:block">
            <TableContainer>
              <Table>
                <thead className="bg-slate-50 text-slate-600">
                  <tr><th className="px-4 py-2">Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t">
                      <td className="px-4 py-2">{user.email}</td>
                      <td>{user.role}</td>
                      <td><StatusBadge tone={getStatusTone(user.status)}>{user.status}</StatusBadge></td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        {canManageUsers ? (
                          <button type="button" onClick={() => setEditing(user)} className="rounded bg-slate-900 px-2 py-1 text-xs text-white">Edit</button>
                        ) : <span className="text-xs text-slate-500">No actions</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </div>
        </>
      ) : null}

      {editing ? (
        <Modal title="Manage user" onClose={() => setEditing(null)}>
          <UserEditForm
            row={editing}
            onClose={() => setEditing(null)}
            onPatch={patchUser}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}

function UserEditForm({ row, onPatch, onClose }: { row: UserRow; onPatch: (payload: Record<string, string>) => Promise<void>; onClose: () => void }) {
  const [role, setRole] = useState<UserRole>(row.role);
  const [busy, setBusy] = useState(false);

  const runAction = async (payload: Record<string, string>) => {
    setBusy(true);
    await onPatch(payload);
    setBusy(false);
    onClose();
  };

  return (
    <div className="space-y-4 text-sm text-slate-700">
      <p className="rounded-lg bg-slate-50 p-3">{row.email}</p>
      <label className="grid gap-1">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</span>
        <select value={role} onChange={(event) => setRole(event.target.value as UserRole)} className="rounded border px-3 py-2">
          {ROLES.map((roleOption) => (
            <option key={roleOption} value={roleOption}>{roleOption}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-2 sm:grid-cols-2">
        <button disabled={busy} type="button" onClick={() => void runAction({ action: "updateRole", role, userId: row.id })} className="rounded bg-slate-900 px-3 py-2 text-white disabled:opacity-60">Save role</button>
        {row.status === "ACTIVE" ? (
          <button disabled={busy} type="button" onClick={() => void runAction({ action: "deactivate", userId: row.id })} className="rounded bg-rose-700 px-3 py-2 text-white disabled:opacity-60">Deactivate</button>
        ) : (
          <button disabled={busy} type="button" onClick={() => void runAction({ action: "activate", userId: row.id })} className="rounded bg-emerald-700 px-3 py-2 text-white disabled:opacity-60">Activate</button>
        )}
      </div>
      <button disabled={busy} type="button" onClick={() => void runAction({ action: "resetPassword", userId: row.id })} className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-slate-700 disabled:opacity-60">Generate password reset link</button>
    </div>
  );
}
