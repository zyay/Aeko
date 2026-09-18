import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aeko",
  description: "Your team of always-on agents that finish the work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-color-mode="dark" data-dark-theme="dark">
      <body className={`${inter.className} primer-body`}>{children}</body>
    </html>
  );
}
