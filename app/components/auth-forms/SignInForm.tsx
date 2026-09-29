'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

import FormBox from "./FormBox";
import TextField from "@/components/notebook/TextField";
import BoxedButton from "@/components/notebook/BoxedButton";
import FormButton from "./FormButton";
import { ROUTES } from "@/config/routes";
import { checkCredentials } from "@/lib/auth/authActions";
import { PASSWORD_MAX_LENGTH } from "@/lib/auth/requirements";
import { formDataToObject, signInSchema } from "@/lib/validation";

/**
 * Sign-in form (email or username + password). `initialError` explains a failed
 * "Sign in with 42" round trip (see app/page.tsx).
 */
export default function SignInForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError("");

    // Same schema as the server action: catches empty fields before a round trip.
    if (!signInSchema.safeParse(formDataToObject(formData)).success) {
      setError("Enter your email or username and your password.");
      return;
    }

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
      <TextField
        label="Email or username"
        name="identifier"
        autoComplete="username"
        required
        maxLength={254}
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={PASSWORD_MAX_LENGTH}
      />

      <FormButton pending={pending} pendingText="Signing in...">
        Sign in
      </FormButton>

      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-ink-muted/30" />
        <span className="font-serif text-xs text-ink-muted">or</span>
        <span className="h-px flex-1 bg-ink-muted/30" />
      </div>

      <BoxedButton href="/api/auth/42" className="h-11 w-full text-lg">
        Sign in with 42
      </BoxedButton>
    </FormBox>
  );
}
