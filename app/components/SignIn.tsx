"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import Form, { type FormState } from "./ui/Form";
import Textbox from "./ui/Textbox";
import FormButton from "./ui/FormButton";

export default function SignIn() {
  const router = useRouter();

  async function loginAction(
    _prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    let res: Response;
    try {
      res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      return {
        error: "Network error. Please check your connection and try again.",
      };
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: data.error ?? "Something went wrong. Please try again." };
    }

    // Refresh so Server Components (layouts, pages reading the auth
    // cookie via getCurrentUser) pick up the newly-set session cookie.
    router.push("/");
    router.refresh();
    return {};
  }

  return (
    <div>
      <header>
        <div className="fixed top-4 right-4 z-50">
          <Link
            href="/register"
            className="border border-gray-300 rounded-2xl px-3 py-2.5 text-sm bg-white hover:bg-gray-100 transition"
          >
            Register
          </Link>
        </div>
      </header>

      <main className="flex min-h-screen items-center justify-center">
        <Form
          action={loginAction}
          title="Sign in"
          subtitle="Welcome back to jeudecartes."
          footer={
            <>
              New here?{" "}
              <Link
                href="/register"
                className="font-medium text-foreground hover:underline"
              >
                Create an account
              </Link>
            </>
          }
        >
          <Textbox
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <Textbox
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />
          <FormButton>Sign in</FormButton>
        </Form>
      </main>
    </div>
  );
}
