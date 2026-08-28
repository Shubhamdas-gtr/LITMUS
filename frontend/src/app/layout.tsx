import type { Metadata } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

const displayFont = localFont({
  src: "./fonts/TbjGobankDemoBold-woKX6.ttf",
  variable: "--font-display",
  weight: "700",
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
    {
      path: "./fonts/GcGatuzodemoExtraBold-PVD5m.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-body",
  display: "swap",
});

const compactFont = localFont({
  src: "./fonts/GulamsCondensedDemoExtrabold-8OBrD.otf",
  variable: "--font-compact",
  weight: "800",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LITMUS | Career intelligence for college students",
    template: "%s | LITMUS",
  },
  description:
    "LITMUS helps college students understand their skills, evidence, and next best career moves.",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${bodyFont.variable} ${compactFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
