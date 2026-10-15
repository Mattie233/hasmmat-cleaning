import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
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
  title: "Hasmmat Cleaning Service Ltd | Residential & Commercial Cleaning Leeds",
  description:
    "Premium residential and commercial cleaning services in Leeds and surrounding areas, including Airbnb, deep cleaning, office and end-of-tenancy cleaning.",
  metadataBase: new URL("https://hasmmat-cleaning.example"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Hasmmat Cleaning Service Ltd",
    description: "Professional cleaning for homes and businesses in Leeds.",
    type: "website",
    locale: "en_GB",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
