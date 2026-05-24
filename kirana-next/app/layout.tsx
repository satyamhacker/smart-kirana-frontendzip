import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Layout } from "@/components/layout";

export const metadata: Metadata = {
  title: "Smart Kirana Store",
  description: "Smart POS for Kirana shops",
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
