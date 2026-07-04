import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { adminConfigured, listAdminTenants, listManagedUsers } from "@/lib/admin";
import { AdminUsers } from "@/components/AdminUsers";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const auth = await getAuthState();
  if (!auth.isAdmin) redirect("/dashboard");

  const configured = adminConfigured();
  const [users, tenants] = configured
    ? await Promise.all([listManagedUsers(), listAdminTenants()])
    : [[], []];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
        <p className="text-sm text-stone-500">
          Add licensed users and revoke access. New users receive a branded invite to set their
          password, then sign in to the organisation and role you choose here.
        </p>
      </div>

      {!configured && (
        <div className="rounded-md border border-orchid/40 bg-[#F1EAF7] px-4 py-3 text-sm text-orchid">
          User management is not configured yet. Add <span className="font-mono">SUPABASE_SERVICE_KEY</span>{" "}
          to the web app's server environment, then reload.
        </div>
      )}

      <AdminUsers
        initialUsers={users}
        tenants={tenants}
        currentEmail={auth.email}
        disabled={!configured}
      />
    </div>
  );
}
