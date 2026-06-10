import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "AI News Dashboard",
  description:
    "The biggest AI & tech news sources, aggregated into one clean, filterable feed.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">
        <AuthProvider>
          <Nav />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
