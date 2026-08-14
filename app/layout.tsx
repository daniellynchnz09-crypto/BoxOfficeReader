import type { Metadata } from "next";
import { Big_Shoulders, Fraunces, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const marquee = Big_Shoulders({
  variable: "--font-marquee",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const editorial = Fraunces({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const ledger = IBM_Plex_Mono({
  variable: "--font-ledger",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Box Office Top 25",
  description: "The 25 highest-grossing films of the year, updated daily.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${marquee.variable} ${editorial.variable} ${ledger.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg">{children}</body>
    </html>
  );
}
