import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Vendio — AI Marketplace Autopilot",
  description:
    "Vendio turns your photos into complete marketplace listings and posts them to Kijiji and Facebook Marketplace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
