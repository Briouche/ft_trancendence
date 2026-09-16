'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { outlinedWhiteTextStyle } from "@/components/notebook/NotebookUI";

import FormBox from "./FormBox";
import FormTextField from "./FormTextField";
import FormButton from "./FormButton";
import { ROUTES } from "@/config/routes";
import { checkCredentials } from "@/lib/auth/formActions";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
  PASSWORD_ALLOWED_CHARS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
} from "@/lib/auth/requirements";

export default function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError("");

    const username = (formData.get("username") as string | null)?.trim();
    const password = formData.get("password") as string | null;

    // We could do additional tests before sending it to the server action

    setPending(true);
    const result = await checkCredentials(formData);
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.push(ROUTES.home);
  };

  return (
    <FormBox
      title="Sign In"
      bottomText="New here?"
      bottomRoute={ROUTES.register}
      bottomRouteText="Create an account"
      action={handleSubmit}
      error={error}
    >
      <FormTextField
        label="Username"
        name="username"
        autoComplete="username"
        required
        minLength={USERNAME_MIN_LENGTH}
        maxLength={USERNAME_MAX_LENGTH}
        pattern={USERNAME_REGEX.source}
        patternTitle="Only letters and numbers are allowed."
      />

      <FormTextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={PASSWORD_MAX_LENGTH}
        pattern={PASSWORD_REGEX.source}
        patternTitle={"Must include an uppercase letter, a lowercase letter, and a number, and contain only letters, numbers, and the symbols " + PASSWORD_ALLOWED_CHARS}
      />

      <FormButton pending={pending} pendingText="Signing in...">
        Sign in
      </FormButton>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-ink-muted/30" />
        <span className="font-serif text-xs text-ink-muted">or</span>
        <span className="h-px flex-1 bg-ink-muted/30" />
      </div>

      <Link
        href="/api/auth/42"
        className="travelbook-slot03a flex h-11 w-full items-center justify-center
        font-display text-lg font-bold text-white transition-transform active:scale-95"
        style={outlinedWhiteTextStyle}
      >
        Sign in with 42
      </Link>
    </FormBox>
  );
}
