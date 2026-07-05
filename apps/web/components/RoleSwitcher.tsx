"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const ROLES = [
  { value: "responsible_body", label: "Responsible body" },
  { value: "lpa", label: "LPA ecologist" },
  { value: "developer", label: "Developer" },
  { value: "ecologist", label: "Field ecologist" },
];

/**
 * Dev-only identity switcher. Writes role/tenant cookies that `getSession`
 * reads; production replaces this with the Supabase Auth session.
 */
export function RoleSwitcher({
  tenants,
  tenantId,
  role,
}: {
  tenants: { id: string; name: string; type: string }[];
  tenantId: string;
  role: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function set(name: string, value: string) {
    document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted">Viewing as</span>
      <select
        aria-label="Role"
        value={role}
        disabled={pending}
        onChange={(e) => set("bc_role", e.target.value)}
        className="rounded-md border border-stone-300 bg-white px-2 py-1"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {tenants.length > 0 && (
        <select
          aria-label="Tenant"
          value={tenantId}
          disabled={pending}
          onChange={(e) => set("bc_tenant", e.target.value)}
          className="rounded-md border border-stone-300 bg-white px-2 py-1"
        >
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
