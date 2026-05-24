import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Layout } from "@/components/layout";

export const metadata: Metadata = {
  title: "Smart Kirana Store",
  description: "Smart POS for Kirana shops",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0d9488",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
