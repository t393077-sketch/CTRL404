import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEENIL — Observability Without Exposure",
  description: "Two-tier telemetry: sensitive metrics stay on-prem, anonymized signals feed central intelligence. Zero plain-text leaks, guaranteed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F4F6FB] text-[#0F1B33] min-h-screen antialiased selection:bg-[#1D4A8A]/20 selection:text-[#1D4A8A]">
        {children}
      </body>
    </html>
  );
}
