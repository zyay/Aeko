import type { Metadata } from "next";
import "@bible-strong/avatar-react/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aeko",
  description: "Your team of always-on agents that finish the work.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
