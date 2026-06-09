import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";

import "@/design/fonts.css";
import "@/design/tokens.css";
import "@/design/themes.css";
import "./globals.css";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Boxel",
  description: "The UI that builds itself",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" className={bodyFont.variable}>
      <body>{children}</body>
    </html>
  );
}
