"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProfileUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: "ONLINE" | "OFFLINE" | "IN_GAME";
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
}

interface ProfileProps {
  user: ProfileUser;
}

function formatJoinDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-BE", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function Profile({ user }: ProfileProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div>
      <header>
        <div className="fixed top-4 left-4 z-50">
          <Link href="/" className="top-button top-button-accent">
            Home
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

      <main className="flex min-h-screen items-center justify-center py-12">
        <section className="mx-auto w-full max-w-sm rounded-2xl border border-gray-300 bg-white p-8 shadow-sm flex flex-col gap-6">
          {/* Header & Avatar */}
          <div className="flex flex-col items-center text-center">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={`${user.username}'s avatar`}
                className="mb-4 h-24 w-24 rounded-full object-cover shadow-sm border border-gray-200"
              />
            ) : (
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 border border-gray-200">
                <span className="text-2xl font-semibold text-gray-400">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <h1 className="text-2xl font-semibold text-foreground">
              {user.username}
            </h1>
            <p className="mt-1 text-sm text-secondary">{user.email}</p>
          </div>

          <hr className="border-gray-200" />

          {/* User Details */}
          <div className="flex flex-col gap-3 text-sm text-foreground">
            <div className="flex justify-between">
              <span className="font-medium text-secondary">Status</span>
              <span className="font-semibold">{user.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-secondary">Email Verified</span>
              <span>{user.emailVerified ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-secondary">2FA Enabled</span>
              <span>{user.twoFactorEnabled ? "Yes" : "No"}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-secondary">Member Since</span>
              <span>{formatJoinDate(user.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-col gap-3">
            {/* Note: Update this href to wherever you mount your EditProfile component */}
            <Link
              href="/editProfile"
              className="flex w-full items-center justify-center rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 transition"
            >
              Edit profile
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
