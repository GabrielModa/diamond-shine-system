"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["ADMIN", "SUPERVISOR", "EMPLOYEE", "VIEWER"] as const;

export function CreateUserForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("EMPLOYEE");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/users", {
        body: JSON.stringify({ email, role }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to create user.");
      }

      setEmail("");
      setRole("EMPLOYEE");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to create user.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Create User</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@company.com"
          className="border rounded px-3 py-2 text-sm text-slate-900"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as (typeof ROLES)[number])}
          className="border rounded px-3 py-2 text-sm text-slate-900"
        >
          {ROLES.map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </select>
        <button
          disabled={isLoading}
          type="submit"
          className="bg-slate-900 text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          {isLoading ? "Creating..." : "Create User"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
