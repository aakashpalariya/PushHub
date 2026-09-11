import type { Metadata, Viewport } from "next";
import { Baloo_2 } from "next/font/google";
import { Toaster } from "@/components/ui/custom-toaster";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PushHub — Web Push Notification Testing Studio",
  description: "Create, preview, and test web push notifications directly from your browser and PWA.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PushHub",
  },
};

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { ThemeProvider, ThemeScript } from "@/components/theme/theme-provider";
import { ConfirmProvider } from "@/components/ui/confirm-dialog";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={baloo.variable} suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider>
          <ConfirmProvider>
            {children}
            <Toaster position="top-right" maxToasts={5} />
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

