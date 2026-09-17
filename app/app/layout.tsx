import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import TransitionOverlay from "@/components/library/TransitionOverlay";
import CustomCursor from "@/components/CustomCursor";
import { getSession } from "@/lib/auth/cookieSession";
import { PresenceProvider } from "@/app/presence";
import HubBackground from "./HubBackground";
import "./globals.css";

// Pixel Game (1001fonts.com/pixel-game-font — free for personal use only, see credits in the
// README) — the font for the whole frontend (globals.css points
// font-display/font-serif/font-sans/font-engraved/font-pixel at it).
const pixelGame = localFont({
  src: "./fonts/PixelGame-Regular.otf",
  variable: "--font-pixel-game",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ft_transcendence",
  description: "The card library of ft_transcendence",
};

// Emitted as <meta name="color-scheme" content="dark"> in the <head> — read by the browser
// before globals.css even arrives, so it's the first line of defense against the white flash.
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
      {/* backgroundColor inline here (not a Tailwind class): the whole point is to avoid the
          white flash while the Tailwind stylesheet is still being injected in dev (Turbopack) —
          a utility class would suffer the same delay. */}
      <body className="min-h-full flex flex-col bg-ink-950">
        <TransitionOverlay />
        <CustomCursor />
        {/* Mounted once here (not in page.tsx, which unmounts on every navigation away from
            "/") so the hub's three-fiber Canvas (WebGL context, shaders, procedural bookshelf
            geometry) never gets rebuilt from scratch when coming back to the hub — see
            HubBackground.tsx. */}
        {session && <HubBackground username={session.username} />}
        {session ? <PresenceProvider>{children}</PresenceProvider> : children}
      </body>
    </html>
  );
}
