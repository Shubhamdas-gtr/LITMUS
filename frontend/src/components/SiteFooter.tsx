import Image from "next/image";
import Link from "next/link";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/assessment", label: "Assessment" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/transition", label: "Profile handoff" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/#evidence", label: "Evidence" },
      { href: "/#tracks", label: "Tracks" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/auth", label: "Sign in" },
      { href: "/assessment", label: "Start assessment" },
    ],
  },
] as const;

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[rgba(5,6,10,0.9)]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.1fr_2fr] lg:px-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3">
            <Image
              src="/litlo-.png"
              alt="LITMUS"
              width={196}
              height={56}
              className="h-14 w-auto object-contain"
            />
            <span className="flex flex-col justify-center">
              <span className="text-[0.62rem] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                Since 2026
              </span>
            </span>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">
            Understand your skills, gather proof from resumes and GitHub, and
            move toward roles that fit your current readiness.
          </p>
          <Link
            href="/assessment"
            className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs uppercase tracking-[0.22em] text-[var(--ink)] transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
          >
            Start your assessment
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[var(--muted)]">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--muted-strong)] underline-offset-4 hover:text-[var(--foreground)] hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
