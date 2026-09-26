import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import TransitionOverlay from "@/components/library/TransitionOverlay";
import CustomCursor from "@/components/CustomCursor";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ui/Toast";
import { RealtimeProvider } from "@/components/realtime/RealtimeProvider";
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
  title: {
    default: "ft_transcendence — card battles",
    template: "%s · ft_transcendence",
  },
  description: "A collectible card game: build decks, open packs and battle other players or the AI.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
};

// Root layout: cursor, route transition overlay, notifications, the legal footer, and for
// signed-in users the realtime socket (presence, chat) and the persistent 3D hub.
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
        <ToastProvider>
          <TransitionOverlay />
          <CustomCursor />
          {session ? (
            <RealtimeProvider userId={session.userId}>
              <HubBackground username={session.username} />
              {children}
            </RealtimeProvider>
          ) : (
            children
          )}
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
