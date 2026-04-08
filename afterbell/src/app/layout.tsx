import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AfterBell — Trading Journal",
  description: "The trade ends. The learning starts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-[#0A0E12] text-[#E2E8F0] antialiased font-[family-name:var(--font-inter)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
