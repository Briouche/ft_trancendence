"use client";

import Link from "next/link";
import { useState } from "react";

import { checkCredentials } from "@/lib/auth";

import Form from "@/components/elements/Form";
import FormButton from "@/components/elements/FormButton";
import TextField from "@/components/elements/TextField";
import { ROUTES } from "@/config/routes";

export default function SignInForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setError("");

    const username = (formData.get("username") as string | null)?.trim();
    const password = formData.get("password") as string | null;

    // ==========================================
    // CUSTOM JAVASCRIPT VALIDATION
    // ==========================================
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }

    if (!password || password.length === 0) {
      setError("Password is required.");
      return;
    }

    if (password.length > 128) {
      setError("Password is too long.");
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
    <div className="flex flex-1 flex-col items-center justify-center p-vertical">
      <Form
        title="Sign In"
        subtitle="Welcome back."
        action={handleSubmit}
        footer={
          <>
            New here?{" "}
            <Link
              href={ROUTES.register}
              className="font-medium text-foreground hover:underline"
            >
              Create an account
            </Link>
          </>
        }
      >
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <TextField
          name="username"
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="..."
          required
          minLength={3}
          maxLength={30}
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="..."
          required
          maxLength={128}
        />
        <FormButton className="mt-3" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </FormButton>
      </Form>
    </div>
  );
}
