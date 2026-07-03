import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth";
import { LogoMark } from "@/components/Logo";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

/**
 * Set-a-new-password screen. Reached when a user signs in on a temporary
 * password (forced change) or follows a password-reset link. Lives outside the
 * (app) route group so the "must change password" gate does not loop.
 */
export default async function ChangePasswordPage() {
  const auth = await getAuthState();
  if (!auth.authenticated) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
      <div className="card w-full max-w-md p-7">
        <div className="mb-5 flex items-center gap-3">
          <LogoMark size={28} />
          <div>
            <div className="wordmark text-lg text-forest">
              Bio<span className="text-orchid">Coda</span>
            </div>
            <div className="text-xs text-muted">Set a new password</div>
          </div>
        </div>
        <p className="mb-4 text-sm text-muted">
          {auth.mustChangePassword
            ? "Your account was set up with a temporary password. Choose your own password to continue."
            : "Choose a new password for your account."}
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
