"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "./Logo";
import { SUPABASE_ENABLED, browserSupabase } from "@/lib/supabase-browser";

const ROLES = [
  { value: "responsible_body", label: "Responsible body" },
  { value: "lpa", label: "Local Planning Authority" },
  { value: "developer", label: "Developer" },
  { value: "ecologist", label: "Field ecologist" },
];

type Mode = "supabase" | "demo" | "forgot";

export function LoginForm({ tenants }: { tenants: { id: string; name: string }[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(SUPABASE_ENABLED ? "supabase" : "demo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("responsible_body");
  const [tenant, setTenant] = useState(tenants[0]?.id ?? "rb-natural-trust");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err === "oauth") setError("That sign-in did not complete. Please try again.");
    else if (err === "not_provisioned") {
      setError("This account is not licensed for BioCoda yet. Ask your administrator to add you.");
    }
  }, []);

  async function supabaseSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supa = browserSupabase();
      const { error } = await supa.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function oauthSignIn(provider: "google" | "azure") {
    setBusy(true);
    setError(null);
    try {
      const supa = browserSupabase();
      const { error } = await supa.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          // Microsoft needs email scope to populate the account email.
          ...(provider === "azure" ? { scopes: "email openid profile" } : {}),
        },
      });
      if (error) throw error;
      // The browser now redirects to the provider; no further action here.
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supa = browserSupabase();
      const { error } = await supa.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function demoSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email || "demo@biocoda.earth", role, tenant }),
      });
      if (!res.ok) throw new Error("sign-in failed");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-md border border-line px-3 py-2 text-sm";
  const primaryBtn = "w-full rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50";

  return (
    <div className="card w-full max-w-md p-7">
      <div className="mb-5 flex items-center gap-3">
        <LogoMark size={28} />
        <div>
          <div className="wordmark text-lg text-forest">
            Bio<span className="text-orchid">Coda</span>
          </div>
          <div className="text-xs text-muted">
            {mode === "forgot" ? "Reset your password" : "Sign in to your portfolio"}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-md border border-orchid/40 bg-[#F1EAF7] px-3 py-2 text-sm text-orchid">
          {error}
        </div>
      )}

      {/* Forgot-password: request a reset link */}
      {mode === "forgot" ? (
        sent ? (
          <div className="space-y-4">
            <p className="rounded-md bg-panel px-3 py-3 text-sm text-muted">
              If an account exists for <span className="font-medium text-ink">{email}</span>, a
              password reset link is on its way. Follow it to set a new password.
            </p>
            <button onClick={() => { setMode("supabase"); setSent(false); }} className="w-full text-center text-xs text-muted underline">
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={sendReset} className="space-y-3">
            <label className="block text-xs font-medium text-ink">
              Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@responsiblebody.example" />
            </label>
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Sending…" : "Send reset link"}
            </button>
            <button type="button" onClick={() => { setMode("supabase"); setError(null); }} className="w-full text-center text-xs text-muted underline">
              Back to sign in
            </button>
          </form>
        )
      ) : mode === "supabase" ? (
        <>
          <div className="mb-4 space-y-2">
            <button type="button" onClick={() => oauthSignIn("google")} disabled={busy} className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-panel disabled:opacity-50">
              <GoogleIcon /> Continue with Google
            </button>
            <button type="button" onClick={() => oauthSignIn("azure")} disabled={busy} className="flex w-full items-center justify-center gap-2.5 rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-panel disabled:opacity-50">
              <MicrosoftIcon /> Continue with Microsoft
            </button>
            <div className="flex items-center gap-3 pt-1 text-[11px] uppercase tracking-wide text-muted">
              <span className="h-px flex-1 bg-line" />
              or with email
              <span className="h-px flex-1 bg-line" />
            </div>
          </div>
          <form onSubmit={supabaseSignIn} className="space-y-3">
            <label className="block text-xs font-medium text-ink">
              Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@responsiblebody.example" />
            </label>
            <label className="block text-xs font-medium text-ink">
              Password
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
            </label>
            <button type="submit" disabled={busy} className={primaryBtn}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <button type="button" onClick={() => { setMode("forgot"); setError(null); }} className="w-full text-center text-xs text-muted underline">
              Forgot password?
            </button>
          </form>
        </>
      ) : (
        <form onSubmit={demoSignIn} className="space-y-3">
          <p className="rounded-md bg-panel px-3 py-2 text-xs text-muted">
            Supabase Auth is not configured in this environment, so this is a local demo sign-in.
          </p>
          <label className="block text-xs font-medium text-ink">
            Email (optional)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="demo@biocoda.earth" />
          </label>
          <label className="block text-xs font-medium text-ink">
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-ink">
            Organisation
            <select value={tenant} onChange={(e) => setTenant(e.target.value)} className={inputClass}>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy ? "Signing in…" : "Continue"}
          </button>
        </form>
      )}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 23 23" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}
