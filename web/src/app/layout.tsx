import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aeko",
  description: "Encrypted workspace for humans and agents.",
};

export const viewport: Viewport = {
  themeColor: "#06080d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-color-mode="dark" data-dark-theme="dark" className={inter.variable}>
      <body className="primer-body">{children}</body>
    </html>
  );
}
