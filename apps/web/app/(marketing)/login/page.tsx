import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { listTenants } from "@/lib/db";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if ((await getAuthState()).authenticated) redirect("/dashboard");

  let tenants: { id: string; name: string }[] = [];
  try {
    tenants = (await listTenants()).map((t) => ({ id: t.id, name: t.name }));
  } catch {
    tenants = [{ id: "rb-natural-trust", name: "Natural Trust Responsible Body" }];
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <LoginForm tenants={tenants} />
      <Link href="/" className="mt-5 text-xs text-muted underline">
        Back to home
      </Link>
    </div>
  );
}
