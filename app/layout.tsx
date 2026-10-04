import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import EnvironmentBadge from "./_components/EnvironmentBadge";
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
  title: "SPV Commitment Tracker",
  description: "Track SPV investment commitments and funding progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <EnvironmentBadge />
        {children}
      </body>
    </html>
  );
}
