import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google"; // 1. Import Inter
import "./globals.css";

// 2. Konfigurasi Inter
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "belajar.ai - Platform Pembelajaran AI #1 di Indonesia",
  description: "Aplikasi pembelajaran AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* Tambahkan suppressHydrationWarning di dalam tag body seperti ini: */}
  <body 
    className={`${inter.className} bg-[#11131f] text-white`} 
    suppressHydrationWarning
  >
    {children}
  </body>
    </html>
  );
}
