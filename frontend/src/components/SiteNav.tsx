"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const links = [
  { href: "/", label: "Home" },
  { href: "/assessment", label: "Assessment" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    const syncFromSession = (
      session: { user?: { email?: string | null; user_metadata?: Record<string, unknown> } | null } | null,
    ) => {
      if (!mounted) return;
      setEmail(session?.user?.email ?? null);
      const name = String(
        (session?.user?.user_metadata as { display_name?: unknown } | undefined)
          ?.display_name ?? "",
      ).trim();
      setDisplayName(name || null);
    };
    void (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        syncFromSession(session);
      } catch {
        // nav auth state is non-critical
      }
    })();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncFromSession(session);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await supabase.auth.signOut();
      setEmail(null);
      setDisplayName(null);
      setMenuOpen(false);
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  };

  const accountLabel = displayName ?? email;

  return (
    <div className="sticky top-0 z-50">
      <div className="site-nav-blur border-b border-[var(--border)] bg-[rgba(5,6,10,0.92)] backdrop-blur">
        <p className="mx-auto w-full max-w-7xl px-4 py-1.5 text-center text-[0.62rem] uppercase tracking-[0.28em] text-[var(--muted)] sm:px-6 lg:px-8">
          <span className="text-[var(--accent)]">GitHub sync is live</span>
          <span className="mx-2 text-[var(--border)]">·</span>
          Connect repos, review leads, close skill gaps
        </p>
      </div>

      <header className="site-nav-blur border-b border-[var(--border)] bg-[rgba(5,6,10,0.86)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="LITMUS home">
            <Image
              src="/litlo-.png"
              alt="LITMUS home"
              width={168}
              height={48}
              priority
              className="h-12 w-auto object-contain"
            />
            <span className="hidden flex-col sm:flex">
              <span className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                career intelligence
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {links.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] transition duration-200 ${
                    isActive
                      ? "border border-[var(--border-strong)] bg-[var(--accent-subtle)] text-[var(--foreground)]"
                      : "border border-transparent text-[var(--muted)] hover:border-[var(--border)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {accountLabel ? (
              <>
                <span
                  title={email ?? undefined}
                  className="max-w-44 truncate rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-3 py-2 text-[0.68rem] tracking-[-0.01em] text-[var(--muted)]"
                >
                  {accountLabel}
                </span>
                <Link
                  href="/welcome?edit=1"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
                >
                  Edit name
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)] disabled:cursor-wait disabled:opacity-60"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                >
                  Sign in
                </Link>
                <Link
                  href="/assessment"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--ink)] shadow-[0_12px_26px_rgba(141,220,16,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
                >
                  Start assessment
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(8,10,16,0.78)] px-4 py-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)] md:hidden"
            aria-expanded={menuOpen}
            aria-controls="site-nav-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {menuOpen ? (
          <div
            id="site-nav-menu"
            className="border-t border-[var(--border)] px-4 py-3 sm:px-6 md:hidden"
          >
            <nav className="flex flex-col gap-2" aria-label="Mobile">
              {links.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-lg border px-4 py-3 text-xs uppercase tracking-[0.22em] ${
                      isActive
                        ? "border-[var(--border-strong)] bg-[var(--accent-subtle)] text-[var(--foreground)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {accountLabel ? (
                <>
                  <Link
                    href="/welcome?edit=1"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg border border-[var(--border)] px-4 py-3 text-xs uppercase tracking-[0.22em] text-[var(--muted)]"
                  >
                    Edit name ({accountLabel})
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="rounded-lg border border-[var(--border)] px-4 py-3 text-left text-xs uppercase tracking-[0.22em] text-[var(--muted)] disabled:opacity-60"
                  >
                    {signingOut ? "Signing out…" : `Sign out (${accountLabel})`}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg border border-[var(--border)] px-4 py-3 text-xs uppercase tracking-[0.22em] text-[var(--muted)]"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/assessment"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg bg-[var(--accent)] px-4 py-3 text-xs uppercase tracking-[0.22em] text-[var(--ink)]"
                  >
                    Start assessment
                  </Link>
                </>
              )}
            </nav>
          </div>
        ) : null}
      </header>
    </div>
  );
}
