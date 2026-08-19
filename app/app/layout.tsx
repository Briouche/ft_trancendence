import type { Metadata, Viewport } from "next";
import { Cinzel, Cinzel_Decorative, Crimson_Text } from "next/font/google";
import TransitionOverlay from "@/components/library/TransitionOverlay";
import AudioProvider from "@/components/AudioProvider";
import AudioToggleButton from "@/components/AudioToggleButton";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const crimson = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});

// Variante gravée/ciselée de Cinzel, pour les enseignes de porte du hall 3D — même famille que
// le display, donc cohérente, mais plus lisible qu'une police "manuscrite" à ce niveau de détail.
const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
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
      className={`${cinzel.variable} ${crimson.variable} ${cinzelDecorative.variable} h-full antialiased`}
      style={{ backgroundColor: '#0b0c0d' }}
    >
      {/* backgroundColor en inline ici (pas en classe Tailwind) : le but est justement
          d'éviter le flash blanc pendant que la feuille Tailwind s'injecte encore en dev
          (Turbopack) — une classe utilitaire subirait le même délai. */}
      <body className="min-h-full flex flex-col bg-ink-950">
        <TransitionOverlay />
        {/* AudioProvider vit dans le layout racine (jamais démonté entre deux pages, contrairement
            au contenu de `children`) : la nappe ambiante ne redémarre pas à chaque navigation. */}
        <AudioProvider>
          {children}
          <AudioToggleButton />
        </AudioProvider>
      </body>
    </html>
  );
}
