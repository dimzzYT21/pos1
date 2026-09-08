import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POS Store",
  description: "POS dengan Next.js + Supabase + Vercel"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}