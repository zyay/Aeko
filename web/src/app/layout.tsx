import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@bible-strong/avatar-react/styles.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Aeko",
  description: "Your team of always-on agents that finish the work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
