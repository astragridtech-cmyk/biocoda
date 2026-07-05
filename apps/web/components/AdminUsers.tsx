"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  role: string;
}

const ROLES = [
  { value: "responsible_body", label: "Responsible body" },
  { value: "lpa", label: "Local Planning Authority" },
  { value: "developer", label: "Developer" },
  { value: "ecologist", label: "Field ecologist" },
];
const ROLE_LABEL = Object.fromEntries(ROLES.map((r) => [r.value, r.label]));

export function AdminUsers({
  initialUsers,
  tenants,
  currentEmail,
  disabled,
}: {
  initialUsers: ManagedUser[];
  tenants: { id: string; name: string }[];
  currentEmail: string | null;
  disabled: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [tenant, setTenant] = useState(tenants[0]?.id ?? "");
  const [role, setRole] = useState("responsible_body");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const tenantName = (id: string) => tenants.find((t) => t.id === id)?.name ?? id;

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name, tenant, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not add the user.");
      setInfo(data.note ?? `Invite sent to ${email}.`);
      setEmail("");
      setName("");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(userEmail: string) {
    if (!window.confirm(`Revoke access for ${userEmail}? They will no longer be able to sign in.`)) return;
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(userEmail)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not revoke access.");
      setInfo(`Access revoked for ${userEmail}.`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const inputClass = "mt-1 w-full rounded-md border border-line px-3 py-2 text-sm disabled:bg-panel disabled:opacity-60";

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="rounded-md border border-orchid/40 bg-[#F1EAF7] px-3 py-2 text-sm text-risk">{error}</div>
      )}
      {info && (
        <div role="status" className="rounded-md border border-forest/40 bg-[#E4EBDE] px-3 py-2 text-sm text-track">{info}</div>
      )}

      {/* Add user */}
      <form onSubmit={addUser} className="card p-5">
        <h2 className="mb-3 font-semibold">Add a user</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-ink">
            Email
            <input type="email" required disabled={disabled} value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="person@organisation.example" />
          </label>
          <label className="block text-xs font-medium text-ink">
            Full name
            <input type="text" required disabled={disabled} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Jane Smith" />
          </label>
          <label className="block text-xs font-medium text-ink">
            Organisation
            <select required disabled={disabled} value={tenant} onChange={(e) => setTenant(e.target.value)} className={inputClass}>
              {tenants.length === 0 && <option value="">No organisations found</option>}
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-ink">
            Role
            <select disabled={disabled} value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" disabled={busy || disabled} className="mt-4 rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50">
          {busy ? "Sending invite…" : "Add user and send invite"}
        </button>
      </form>

      {/* Existing users */}
      <div className="card p-5">
        <h2 className="mb-3 font-semibold">Users ({initialUsers.length})</h2>
        {initialUsers.length === 0 ? (
          <p className="text-sm text-muted">No users yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Name</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Email</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Organisation</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Role</th>
                  <th scope="col" className="py-2 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {initialUsers.map((u) => {
                  const isSelf = currentEmail && u.email.toLowerCase() === currentEmail.toLowerCase();
                  return (
                    <tr key={u.id} className="border-b border-line/60">
                      <td className="py-2.5 pr-4 text-ink">{u.name}</td>
                      <td className="py-2.5 pr-4 text-stone-600">{u.email}</td>
                      <td className="py-2.5 pr-4 text-stone-600">{tenantName(u.tenantId)}</td>
                      <td className="py-2.5 pr-4 text-stone-600">{ROLE_LABEL[u.role] ?? u.role}</td>
                      <td className="py-2.5 text-right">
                        {isSelf ? (
                          <span className="text-xs text-muted">You</span>
                        ) : (
                          <button onClick={() => revoke(u.email)} className="text-xs font-medium text-risk hover:underline">
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
