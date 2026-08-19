import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const displayFont = localFont({
  src: "./fonts/TbjGobankDemoBold-woKX6.ttf",
  variable: "--font-display",
  weight: "700",
  style: "normal",
  display: "swap",
});

const heroFont = localFont({
  src: "./fonts/TbjGobankDemoRegular-vnML9.ttf",
  variable: "--font-hero",
  weight: "400",
  style: "normal",
  display: "swap",
});

const bodyFont = localFont({
  src: [
    {
      path: "./fonts/GcGatuzodemoRegular-ovZ6d.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/GcGatuzodemoMedium-gwoJ1.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/GcGatuzodemoSemiBold-4np6p.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/GcGatuzodemoBold-drLJX.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LITMUS | Career readiness for college students",
  description:
    "Understand your skills, identify gaps, build evidence, and move toward relevant opportunities with guided career readiness.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${heroFont.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
