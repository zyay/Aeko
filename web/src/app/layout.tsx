import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lyan",
  description: "Your team of always-on agents that finish the work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
