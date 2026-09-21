import type { Metadata } from "next";
import "./learn.css";

export const metadata: Metadata = {
  title: "abc — learn english easily",
  description: "Intelligent language learning: reading, listening, vocabulary, and GPT practice.",
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
