import type { Metadata } from "next";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
      <body className="bg-background min-h-screen">
        <Header />

        <main>{children}</main>

        <Footer />
      </body>
    </html>
  );
}
