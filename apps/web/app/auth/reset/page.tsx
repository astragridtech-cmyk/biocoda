"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { browserSupabase } from "@/lib/supabase-browser";
import { LogoMark } from "@/components/Logo";

/**
 * Password-reset landing page. The reset email link lands here carrying a
 * recovery token (as a query code or a URL hash, depending on Supabase's flow).
 * This runs on the client so it can pick up either form, establish the recovery
 * session, and show the set-a-new-password form. After the password is set, the
 * user is signed out and sent to the sign-in page to log in with the new one.
 */
export default function ResetPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"verifying" | "ready" | "invalid">("verifying");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const supa = browserSupabase();
    const markReady = () => {
      if (!readyRef.current) {
        readyRef.current = true;
        setPhase("ready");
      }
    };
    // Supabase fires this once it has processed a recovery token in the URL.
    const { data: sub } = supa.auth.onAuthStateChange((_event, session) => {
      if (session) markReady();
    });
    (async () => {
      // Query-code (PKCE) flow: exchange the code for a session.
      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { error } = await supa.auth.exchangeCodeForSession(code);
        if (!error) return markReady();
      }
      // Otherwise the hash-token flow is picked up automatically; give it a
      // moment, then confirm a session exists.
      setTimeout(async () => {
        const { data } = await supa.auth.getSession();
        if (data.session) markReady();
        else if (!readyRef.current) setPhase("invalid");
      }, 1500);
    })();
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setError("Use at least 8 characters.");
    if (pw !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    setError(null);
    try {
      const supa = browserSupabase();
      const { error } = await supa.auth.updateUser({ password: pw, data: { must_change_password: false } });
      if (error) throw error;
      await supa.auth.signOut();
      router.push("/login?reset=done");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-md border border-line px-3 py-2 text-sm";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6">
      <div className="card w-full max-w-md p-7">
        <div className="mb-5 flex items-center gap-3">
          <LogoMark size={28} />
          <div>
            <div className="wordmark text-lg text-forest">
              Bio<span className="text-orchid">Coda</span>
            </div>
            <div className="text-xs text-muted">Choose a new password</div>
          </div>
        </div>

        {phase === "verifying" && (
          <p className="rounded-md bg-panel px-3 py-3 text-sm text-muted">Verifying your reset link...</p>
        )}

        {phase === "invalid" && (
          <div className="space-y-4">
            <div className="rounded-md border border-orchid/40 bg-[#F1EAF7] px-3 py-2 text-sm text-orchid">
              This reset link is invalid or has expired. Request a new one from the sign-in page.
            </div>
            <Link href="/login" className="block w-full rounded-md bg-moss px-4 py-2 text-center text-sm font-medium text-white hover:bg-leaf">
              Back to sign in
            </Link>
          </div>
        )}

        {phase === "ready" && (
          <form onSubmit={submit} className="space-y-3">
            <p className="mb-1 text-sm text-muted">Set a new password. You will then sign in with it.</p>
            {error && (
              <div className="rounded-md border border-orchid/40 bg-[#F1EAF7] px-3 py-2 text-sm text-orchid">{error}</div>
            )}
            <label className="block text-xs font-medium text-ink">
              New password
              <input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} className={inputClass} autoComplete="new-password" />
            </label>
            <label className="block text-xs font-medium text-ink">
              Confirm new password
              <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} autoComplete="new-password" />
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50">
              {busy ? "Saving..." : "Set password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
