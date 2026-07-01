"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function SignOut({ email }: { email: string | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function signOut() {
    start(() => {
      void fetch("/api/auth/signout", { method: "POST" }).then(() => {
        router.push("/");
        router.refresh();
      });
    });
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      {email && <span className="hidden text-muted md:inline">{email}</span>}
      <button
        onClick={signOut}
        disabled={pending}
        className="rounded-md border border-line px-2.5 py-1 hover:bg-panel disabled:opacity-50"
      >
        Sign out
      </button>
    </div>
  );
}
