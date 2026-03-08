"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const ROLES = ["ADMIN", "SUPERVISOR", "EMPLOYEE", "VIEWER"] as const;

type UpdateUserRoleFormProps = {
  currentRole: string;
  userId: string;
};

export function UpdateUserRoleForm({ currentRole, userId }: UpdateUserRoleFormProps) {
  const router = useRouter();
  const [role, setRole] = useState(currentRole);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/users", {
        body: JSON.stringify({
          action: "updateRole",
          role,
          userId,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Failed to update role.");
      }

      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to update role.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <select
        value={role}
        onChange={(event) => setRole(event.target.value)}
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
        className="bg-slate-900 text-white px-4 py-2 rounded text-xs disabled:opacity-60"
      >
        {isLoading ? "Saving..." : "Save"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </form>
  );
}
