"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

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
    </div>
  );
}
