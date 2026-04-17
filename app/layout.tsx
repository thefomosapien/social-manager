import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duhbate Social",
  description: "Multi-brand social media approval dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
