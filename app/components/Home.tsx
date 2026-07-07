"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const MENU = [
  {
    href: "/collection",
    label: "Collection",
    description: "Parcourir toutes les cartes disponibles",
    emoji: "📚",
    available: true,
  },
  {
    href: "/deck",
    label: "Construire un deck",
    description: "Choisir tes cartes pour la prochaine partie",
    emoji: "🃏",
    available: true,
  },
  {
    href: "/game",
    label: "Jouer une partie",
    description: "Bientôt disponible",
    emoji: "⚔️",
    available: false,
  },
];

export default function Home() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort: even if the request fails, send the user back to
      // sign-in — worst case they just get bounced by the auth check there.
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div>
      <header>
        <div className="fixed top-4 right-25 z-50">
          <Link href="/profile" className="top-button top-button-accent">
            Profile
          </Link>
        </div>

        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            onClick={handleLogout}
            className="top-button top-button-accent text-danger hover:text-white"
          >
            Log out
          </button>
        </div>
      </header>

      <main>
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-8 p-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2">
              ft_transcendence
            </h1>
            <p className="text-gray-400 text-lg">Card Game</p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-md">
            {MENU.map((item) =>
              item.available ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 bg-gray-800 hover:bg-gray-700 transition-colors rounded-xl p-5 border border-gray-700"
                >
                  <span className="text-4xl">{item.emoji}</span>
                  <div>
                    <div className="text-white font-bold text-lg">
                      {item.label}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {item.description}
                    </div>
                  </div>
                </Link>
              ) : (
                <div
                  key={item.href}
                  className="flex items-center gap-4 bg-gray-800/50 rounded-xl p-5 border border-gray-700/50 opacity-50 cursor-not-allowed"
                >
                  <span className="text-4xl">{item.emoji}</span>
                  <div>
                    <div className="text-white font-bold text-lg">
                      {item.label}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {item.description}
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
