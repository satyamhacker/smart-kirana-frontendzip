import type { Metadata } from "next";
import "@/index.css";
import { Providers } from "./providers";
import { Layout } from "@/components/layout";

export const metadata: Metadata = {
  title: "Smart Kirana Store",
  description: "Smart POS and inventory management for Kirana stores",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
