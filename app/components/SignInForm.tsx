"use client";

import Link from "next/link";
import { useState } from "react";

import { checkCredentials } from "@/lib/auth";
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, firstIssue, formDataToObject, loginSchema } from "@/lib/validation";
import { ROUTES } from "@/config/routes";
import { outlinedWhiteTextStyle } from "@/components/notebook/NotebookUI";
import ScaleToFit from "@/components/ScaleToFit";

/** Sign-in card: username/email + password, or "Sign in with 42". */
export default function SignInForm({ initialError }: { initialError?: string }) {
  const [error, setError] = useState(initialError ?? "");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError("");

    const parsed = loginSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setPending(true);
    const result = await checkCredentials(formData);
    setPending(false);

    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <ScaleToFit className="flex-1">
      <div className="travelbook-frame4-panel flex w-96 flex-col p-7">
        <h2
          className="text-center font-display text-5xl font-bold text-white"
          style={outlinedWhiteTextStyle}
        >
          Sign In
        </h2>

        <form action={handleSubmit} className="mt-5 flex flex-col gap-3">
          {error && (
            <p role="alert" className="text-center text-sm text-red-500">
              {error}
            </p>
          )}

          <label className="flex flex-col gap-1">
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
              Username or email
            </span>
            <input
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="..."
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
              autoComplete="current-password"
              placeholder="..."
              required
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
            {pending ? "Signing in..." : "Sign in"}
          </button>

          <div className="flex items-center gap-3 py-1">
            <span className="h-px flex-1 bg-ink-muted/30" />
            <span className="font-serif text-xs text-ink-muted">or</span>
            <span className="h-px flex-1 bg-ink-muted/30" />
          </div>

          <a
            href="/api/auth/42"
            className="travelbook-slot03a flex h-11 w-full items-center justify-center
              font-display text-lg font-bold text-white transition-transform active:scale-95"
            style={outlinedWhiteTextStyle}
          >
            Sign in with 42
          </a>
        </form>

        <p className="mt-5 text-center font-serif text-base text-ink-muted">
          New here?{" "}
          <Link
            href={ROUTES.register}
            className="font-medium text-ink-text hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </ScaleToFit>
  );
}
