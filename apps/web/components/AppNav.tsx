"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Portfolio" },
  { href: "/digest", label: "Digest" },
  { href: "/plans", label: "Import plan" },
];

/** Top-bar nav with an active pill on the current route (per the v2 spec). */
export function AppNav({ isAdmin, isEcologist }: { isAdmin?: boolean; isEcologist?: boolean }) {
  const path = usePathname();
  const links = [
    ...LINKS,
    ...(isEcologist ? [{ href: "/surveys", label: "Surveys" }] : []),
    ...(isAdmin ? [{ href: "/admin/users", label: "Team" }] : []),
  ];
  return (
    <nav className="hidden items-center gap-1 text-sm sm:flex">
      {links.map((l) => {
        const active = path === l.href || (l.href === "/dashboard" && path?.startsWith("/parcels"));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              active
                ? "rounded-lg bg-[#E6EDE2] px-3 py-[7px] font-semibold text-ink"
                : "rounded-lg px-3 py-[7px] font-medium text-muted hover:text-ink"
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
