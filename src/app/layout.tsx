import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAInstaller from "@/components/PWAInstaller";
import { I18nProvider } from "@/lib/i18n/index";
import DynamicLayout from "@/components/DynamicLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InternshipBridge",
  description: "Connecting talented students with amazing internship opportunities. Your bridge to professional experience.",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: [
    "internship",
    "jobs",
    "students",
    "employers",
    "careers",
    "professional development",
  ],
  authors: [
    {
      name: "InternshipBridge Team",
    },
  ],
  icons: [
    { rel: "apple-touch-icon", url: "/next.svg" },
    { rel: "icon", url: "/next.svg" },
  ],
};

export const viewport: Viewport = {
  minimumScale: 1,
  initialScale: 1,
  width: "device-width",
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="InternshipBridge" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-tap-highlight" content="no" />
        <link rel="apple-touch-icon" href="/next.svg" />
        <link rel="icon" type="image/svg+xml" href="/next.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <I18nProvider>
          <DynamicLayout>
            <PWAInstaller />
            {children}
          </DynamicLayout>
        </I18nProvider>
      </body>
    </html>
  );
}
