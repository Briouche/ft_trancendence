import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import TransitionOverlay from "@/components/home-library/TransitionOverlay";
import CustomCursor from "@/components/CustomCursor";
<<<<<<< HEAD
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";
import { getSession } from "@/lib/session";
=======
import BackgroundMusic from "@/components/BackgroundMusic";
import { getSession } from "@/lib/auth/cookieSession";
import { PresenceProvider } from "@/app/presence";
>>>>>>> origin/merge/readme-review-dev
import HubBackground from "./HubBackground";
import "./globals.css";

// Single font of the whole site, exposed as --font-pixel-game.
const pixelGame = localFont({
  src: "./fonts/PixelGame-Regular.otf",
  variable: "--font-pixel-game",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ft_transcendence — card battles",
    template: "%s · ft_transcendence",
  },
  description: "A collectible card game: build decks, open packs and battle other players or the AI.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
};

/**
 * Root layout: cursor, route transition overlay, notifications, the legal footer, and for
 * signed-in users the realtime socket (presence, chat) and the persistent 3D hub.
 */
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
<<<<<<< HEAD
        <ToastProvider>
          <TransitionOverlay />
          <CustomCursor />
          {session ? (
            <RealtimeProvider key={session.userId} userId={session.userId}>
              <HubBackground username={session.username} />
              {children}
            </RealtimeProvider>
          ) : (
            children
          )}
          <Footer />
        </ToastProvider>
=======
        <TransitionOverlay />
        <CustomCursor />
        <BackgroundMusic />
        {session && <HubBackground username={session.username} />}
        {session ? <PresenceProvider>{children}</PresenceProvider> : children}
>>>>>>> origin/merge/readme-review-dev
      </body>
    </html>
  );
}
