"use client";

import { useRouter } from "next/navigation";

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
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            onClick={handleLogout}
            className="border border-gray-300 rounded-2xl px-3 py-2.5 text-sm bg-white hover:bg-gray-100 transition"
          >
            Logout
          </button>
        </div>
      </header>
    </div>
  );
}
