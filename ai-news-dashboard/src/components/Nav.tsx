"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/sources", label: "Sources" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-canvas/85 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-sm font-bold text-white">
            AI
          </span>
          <span className="hidden sm:inline">News Dashboard</span>
        </Link>

        <div className="ml-2 flex items-center gap-1">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent/15 text-accent"
                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <span className="hidden text-sm text-neutral-400 md:inline">{user.email}</span>
              <button onClick={() => logout()} className="btn-ghost">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
