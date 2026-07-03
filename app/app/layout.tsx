import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";

export const metadata: Metadata = {
  title: "jeudecartes.super.be",
  description:
    "meilleur jeu de cartes collectibles super chouette gratuit amusant incroyable",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="flex flex-col min-h-screen bg-gray-100"
        style={{
          backgroundImage: "url('/texture.svg')",
        }}
      >
        <div className="h-header px-padding-x py-padding-y">
          <Header />
        </div>

        <main className="flex-1 px-padding-x py-padding-y">{children}</main>

        <div className="h-footer px-padding-x py-padding-y">
          <Footer />
        </div>
      </body>
    </html>
  );
}
