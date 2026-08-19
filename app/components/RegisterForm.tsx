"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { registerUser } from "@/lib/auth";
import Form from "@/components/elements/Form";
import FormButton from "@/components/elements/FormButton";
import TextField from "@/components/elements/TextField";
import { ROUTES } from "@/config/routes";

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
    <div className="flex flex-1 flex-col items-center justify-center p-vertical">
      <Form
        title="Register"
        subtitle="Create a new account."
        action={handleSubmit}
        footer={
          <>
            Already have an account?{" "}
            <Link
              href={ROUTES.home}
              className="font-medium text-foreground hover:underline"
            >
              Sign in
            </Link>
          </>
        }
      >
        {error && (
          <p role="alert" className="text-red-500 text-sm text-center">
            {error}
          </p>
        )}

        <TextField
          name="username"
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="Choose a username"
          required
          minLength={3}
          maxLength={30}
          pattern="^[a-zA-Z0-9_]+$"
          title="Username can only contain letters, numbers, and underscores."
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          maxLength={254}
        />
        <TextField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          minLength={8}
          maxLength={128}
        />
        <TextField
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          required
          minLength={8}
          maxLength={128}
        />
        <FormButton className="mt-3" disabled={pending}>
          {pending ? "Creating account..." : "Make new account"}
        </FormButton>
      </Form>
    </div>
  );
}
