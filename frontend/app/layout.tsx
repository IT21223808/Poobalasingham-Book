import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

/* =========================================================
   GLOBAL FONT
========================================================= */

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/* =========================================================
   METADATA
========================================================= */

export const metadata: Metadata = {
  title: "Poobalasingham Book Depot",
  description: "Bookstore Management System",
  icons: {
    icon: "/images/logo2.png",
    shortcut: "/images/logo2.png",
    apple: "/images/logo2.png",
  },
};

/* =========================================================
   ROOT LAYOUT
========================================================= */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${inter.variable}`}
    >
      <body className="min-h-full font-sans antialiased">
        {children}
      </body>
    </html>
  );
}