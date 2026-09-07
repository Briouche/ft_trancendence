import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import TransitionOverlay from "@/components/library/TransitionOverlay";
import CustomCursor from "@/components/CustomCursor";
import { getSession } from "@/lib/session";
import HubBackground from "./HubBackground";
import "./globals.css";

// Pixel Game (1001fonts.com/pixel-game-font — gratuit usage personnel uniquement, voir credits
// dans le README) — police de tout le front (globals.css y fait pointer
// font-display/font-serif/font-sans/font-engraved/font-pixel).
const pixelGame = localFont({
  src: "./fonts/PixelGame-Regular.otf",
  variable: "--font-pixel-game",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ft_transcendence",
  description: "The card library of ft_transcendence",
};

// Émis comme <meta name="color-scheme" content="dark"> dans le <head> — lu par le navigateur
// avant même que globals.css arrive, donc c'est la première ligne de défense contre le flash blanc.
export const viewport: Viewport = {
  colorScheme: "dark",
};

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
      {/* backgroundColor en inline ici (pas en classe Tailwind) : le but est justement
          d'éviter le flash blanc pendant que la feuille Tailwind s'injecte encore en dev
          (Turbopack) — une classe utilitaire subirait le même délai. */}
      <body className="min-h-full flex flex-col bg-ink-950">
        <TransitionOverlay />
        <CustomCursor />
        {/* Monté une seule fois ici (pas dans page.tsx, qui se démonte à chaque navigation hors
            de "/") pour que le Canvas three-fiber du hub (contexte WebGL, shaders, géométrie
            procédurale des bibliothèques) ne soit jamais reconstruit à froid en revenant sur le
            hub — voir HubBackground.tsx. */}
        {session && <HubBackground username={session.username} />}
        {children}
      </body>
    </html>
  );
}
