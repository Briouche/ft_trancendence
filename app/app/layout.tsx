import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import TransitionOverlay from "@/components/library/TransitionOverlay";
import AudioProvider from "@/components/AudioProvider";
import CustomCursor from "@/components/CustomCursor";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        {/* AudioProvider vit dans le layout racine (jamais démonté entre deux pages, contrairement
            au contenu de `children`) : la nappe ambiante ne redémarre pas à chaque navigation. */}
        <AudioProvider>
          {children}
        </AudioProvider>
      </body>
    </html>
  );
}
