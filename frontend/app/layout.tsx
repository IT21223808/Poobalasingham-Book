import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poobalasingham Book Depot",
  description: "Bookstore Management System",
  icons: {
    icon: "/images/logo2.png",
    shortcut: "/images/logo2.png",
    apple: "/images/logo2.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        {children}
      </body>
    </html>
  );
}