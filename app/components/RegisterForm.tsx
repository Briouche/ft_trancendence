"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { registerUser } from "@/lib/auth";
import { ROUTES } from "@/config/routes";
import { outlinedWhiteTextStyle } from "@/components/notebook/NotebookUI";
import ScaleToFit from "@/components/ScaleToFit";

export default function RegisterForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    setError("");

    const username = (formData.get("username") as string | null)?.trim();
    const email = (formData.get("email") as string | null)?.trim();
    const password = formData.get("password") as string | null;
    const confirmPassword = formData.get("confirmPassword") as string | null;

    // ==========================================
    // CUSTOM JAVASCRIPT VALIDATION
    // ==========================================

    // 1. Username checks
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    // 2. Additional Email Regex check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please provide a valid email address.");
      return;
    }

    // 3. Password Complexity (1 uppercase, 1 lowercase, 1 number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!password || password.length > 128 || !passwordRegex.test(password)) {
      setError(
        "Password must be 8-128 characters long and include an uppercase letter, a lowercase letter, and a number."
      );
      return;
    }

    // 4. Password Match check
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    const result = await registerUser(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(ROUTES.home);
  };

  return (
    // flex-1 (not the default h-screen): see SignInForm.tsx.
    <ScaleToFit className="flex-1">
      {/* Same "parchment" frame (Frame04a) as Sign In — see SignInForm.tsx. */}
      <div className="travelbook-frame4-panel flex w-96 flex-col p-7">
        <h2
          className="text-center font-display text-5xl font-bold text-white"
          style={outlinedWhiteTextStyle}
        >
          Register
        </h2>
        <p className="mt-1 text-center font-serif text-sm text-ink-muted">
          Create a new account.
        </p>

        <form action={handleSubmit} className="mt-5 flex flex-col gap-3">
          {error && (
            <p role="alert" className="text-center text-sm text-red-500">
              {error}
            </p>
          )}

          <label className="flex flex-col gap-1">
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
              Username
            </span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a username"
              required
              minLength={3}
              maxLength={30}
              pattern="^[a-zA-Z0-9_]+$"
              title="Username can only contain letters, numbers, and underscores."
              className="travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif
                text-base text-ink-text placeholder:text-ink-muted/60 outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
              Email
            </span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              maxLength={254}
              className="travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif
                text-base text-ink-text placeholder:text-ink-muted/60 outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
              Password
            </span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={8}
              maxLength={128}
              className="travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif
                text-base text-ink-text placeholder:text-ink-muted/60 outline-none"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
              Confirm password
            </span>
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              required
              minLength={8}
              maxLength={128}
              className="travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif
                text-base text-ink-text placeholder:text-ink-muted/60 outline-none"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="travelbook-slot03a mt-2 h-11 w-full font-display text-lg font-bold text-white
              transition-transform active:scale-95 disabled:opacity-30"
            style={outlinedWhiteTextStyle}
          >
            {pending ? "Creating account..." : "Make new account"}
          </button>
        </form>

        <p className="mt-5 text-center font-serif text-base text-ink-muted">
          Already have an account?{" "}
          <Link
            href={ROUTES.home}
            className="font-medium text-ink-text hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </ScaleToFit>
  );
}
