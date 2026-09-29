'use client';

import { useRouter } from "next/navigation";
import { useState } from "react";

import FormBox from "./FormBox";
import TextField from "@/components/notebook/TextField";
import FormButton from "./FormButton";
import { ROUTES } from "@/config/routes";
import { registerUser } from "@/lib/auth/authActions";
import { firstIssue, formDataToObject, registerSchema } from "@/lib/validation";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
  PASSWORD_ALLOWED_CHARS,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  EMAIL_REGEX,
  EMAIL_MAX_LENGTH,
} from "@/lib/auth/requirements";

/** Account creation form (username, email, password twice), validated before submitting. */
export default function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError("");

    // Same schema as the server action, for immediate feedback; the server checks again.
    const parsed = registerSchema.safeParse(formDataToObject(formData));
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
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
    <FormBox
      title="Register"
      bottomText="Already have an account?"
      bottomRoute={ROUTES.home}
      bottomRouteText="Sign in"
      action={handleSubmit}
      error={error}
    >

      <TextField
        label="Username"
        name="username"
        autoComplete="username"
        placeholder="Choose a username"
        required
        minLength={USERNAME_MIN_LENGTH}
        maxLength={USERNAME_MAX_LENGTH}
        pattern={USERNAME_REGEX.source}
        patternTitle="Only letters and numbers are allowed."
      />

      <TextField
        label="Email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        maxLength={EMAIL_MAX_LENGTH}
        pattern={EMAIL_REGEX.source}
        patternTitle="Enter a valid email."
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
        maxLength={PASSWORD_MAX_LENGTH}
        pattern={PASSWORD_REGEX.source}
        patternTitle={"Must include an uppercase letter, a lowercase letter, and a number, and contain only letters, numbers, and the symbols " + PASSWORD_ALLOWED_CHARS}
      />

      <TextField
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        required
        maxLength={PASSWORD_MAX_LENGTH}
        pattern={PASSWORD_REGEX.source}
        patternTitle={"Must include an uppercase letter, a lowercase letter, and a number, and contain only letters, numbers, and the symbols " + PASSWORD_ALLOWED_CHARS}
      />


      <FormButton pending={pending} pendingText="Creating account...">
        Register
      </FormButton>
    </FormBox>
  );
}
