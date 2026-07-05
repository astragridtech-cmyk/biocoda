"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase-browser";

/**
 * Sets a new password on the current Supabase session and clears the
 * must_change_password flag, then sends the user into the app. Used both for
 * the forced change at first login and for the password-reset link.
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setError("Use at least 8 characters.");
    if (pw !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    setError(null);
    try {
      const supa = browserSupabase();
      const { error } = await supa.auth.updateUser({
        password: pw,
        data: { must_change_password: false },
      });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-md border border-line px-3 py-2 text-sm";

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && (
        <div role="alert" className="rounded-md border border-orchid/40 bg-[#F1EAF7] px-3 py-2 text-sm text-risk">
          {error}
        </div>
      )}
      <label className="block text-xs font-medium text-ink">
        New password
        <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} className={inputClass} autoComplete="new-password" aria-describedby="pw-hint" />
      </label>
      <p id="pw-hint" className="text-xs text-muted">Use at least 8 characters.</p>
      <label className="block text-xs font-medium text-ink">
        Confirm new password
        <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />
      </label>
      <button type="submit" disabled={busy} className="w-full rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50">
        {busy ? "Saving…" : "Set password and continue"}
      </button>
    </form>
  );
}
