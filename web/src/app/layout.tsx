import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aeko",
  description: "Encrypted workspace for humans and agents.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-color-mode="dark" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={`primer-body ${GeistSans.className}`}>{children}</body>
    </html>
  );
}
