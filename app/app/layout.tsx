import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import TransitionOverlay from "@/components/library/TransitionOverlay";
import CustomCursor from "@/components/CustomCursor";
import BackgroundMusic from "@/components/BackgroundMusic";
import { getSession } from "@/lib/session";
import HubBackground from "./HubBackground";
import "./globals.css";

// Single font of the whole site, exposed as --font-pixel-game.
const pixelGame = localFont({
  src: "./fonts/PixelGame-Regular.otf",
  variable: "--font-pixel-game",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ft_transcendence",
  description: "The card library of ft_transcendence",
};

export const viewport: Viewport = {
  colorScheme: "dark",
};

// Root layout: cursor, route transition overlay, and the persistent 3D hub for signed-in users.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html
      lang="fr"
      className={`${pixelGame.variable} h-full antialiased`}
      style={{ backgroundColor: '#0b0c0d' }}
    >
      <body className="min-h-full flex flex-col bg-ink-950">
        <TransitionOverlay />
        <CustomCursor />
        <BackgroundMusic />
        {session && <HubBackground username={session.username} />}
        {children}
      </body>
    </html>
  );
}
