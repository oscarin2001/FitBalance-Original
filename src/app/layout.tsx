import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitBalance",
  description: "Base Next.js + Prisma para gestion de usuarios y nutricion.",
  manifest: "/manifest.webmanifest",
  applicationName: "FitBalance",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitBalance",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="theme">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
