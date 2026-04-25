import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

import { Plus_Jakarta_Sans } from "next/font/google";
import Navbar from "@/components/ui/Navbar";
import BetSlip from "@/components/bet/BetSlip";
import BottomNav from "@/components/layout/BottomNav";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DingoBet",
  description: "Sports betting platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} antialiased`}>
        <Providers>
          <Navbar />
          <BetSlip />
          <main className="pb-20">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
