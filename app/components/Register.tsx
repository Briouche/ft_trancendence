"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import Form, { type FormState } from "./ui/Form";
import Textbox from "./ui/Textbox";
import FormButton from "./ui/FormButton";

export default function Register() {
  const router = useRouter();

  async function registerAction(
    _prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const email = String(formData.get("email") ?? "");
    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    let res: Response;
    try {
      res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password, confirmPassword }),
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
            href="/"
            className="border border-gray-300 rounded-2xl px-3 py-2.5 text-sm bg-white hover:bg-gray-100 transition"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex min-h-screen items-center justify-center">
        <Form
          action={registerAction}
          title="Create an account"
          subtitle="Join jeudecartes and start collecting."
          footer={
            <>
              Already have an account?{" "}
              <Link
                href="/"
                className="font-medium text-foreground hover:underline"
              >
                Sign in
              </Link>
            </>
          }
        >
          <Textbox name="username" label="Username" autoComplete="username" />
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
            autoComplete="new-password"
          />
          <Textbox
            name="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
          />
          <FormButton>Create account</FormButton>
        </Form>
      </main>
    </div>
  );
}
