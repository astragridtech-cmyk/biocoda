import { redirect } from "next/navigation";
import { getSession, getAuthState } from "@/lib/auth";
import { hasSupabase } from "@/lib/supabase";
import { listTenants } from "@/lib/db";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { Logo } from "@/components/Logo";
import { AppNav } from "@/components/AppNav";
import { NotificationsBell } from "@/components/NotificationsBell";
import { SignOut } from "@/components/SignOut";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthState();
  if (!auth.authenticated) redirect("/login");
  // Invite-only: authenticated but no licence on record.
  if (!auth.provisioned) redirect("/login?error=not_provisioned");
  // First login on a temporary password: force a new one before granting access.
  if (auth.mustChangePassword) redirect("/account/change-password");

  const session = await getSession();
  // The organisation switcher is a local-demo convenience. For real licensed
  // users the organisation is bound to the account, so it is hidden.
  const showSwitcher = !hasSupabase();
  let tenants: { id: string; name: string; type: string }[] = [];
  if (showSwitcher) {
    try {
      tenants = await listTenants();
    } catch {
      // DB not up yet; header still renders.
    }
  }

  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-5">
            <a href="/dashboard" className="flex items-center gap-3">
              <Logo />
            </a>
            <AppNav />
          </div>
          <div className="flex items-center gap-3">
            {showSwitcher && (
              <RoleSwitcher tenants={tenants} tenantId={session.tenantId} role={session.role} />
            )}
            <NotificationsBell />
            <SignOut email={auth.email} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </>
  );
}
