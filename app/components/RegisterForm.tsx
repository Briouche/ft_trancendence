"use client";

import Link from "next/link";
import { useState } from "react";

import { registerUser } from "@/lib/auth";
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  firstIssue,
  formDataToObject,
  registerSchema,
} from "@/lib/validation";
import { ROUTES } from "@/config/routes";
import { outlinedWhiteTextStyle } from "@/components/notebook/NotebookUI";
import ScaleToFit from "@/components/ScaleToFit";

/** Registration card: username, email, password (twice), validated with registerSchema. */
export default function RegisterForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError("");

    const parsed = registerSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setPending(true);
    // On success the action redirects to the hub and never returns here.
    const result = await registerUser(formData);
    setPending(false);

    if (result?.error) setError(result.error);
  };

  return (
    <ScaleToFit className="flex-1">
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
              minLength={USERNAME_MIN_LENGTH}
              maxLength={USERNAME_MAX_LENGTH}
              pattern={USERNAME_PATTERN}
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
              maxLength={EMAIL_MAX_LENGTH}
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
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
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
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
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
