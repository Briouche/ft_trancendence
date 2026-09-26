import { getSession } from "@/lib/session";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignInForm from "@/components/SignInForm";

// ?error=… values set by the 42 OAuth callback (app/api/auth/42/callback/route.ts).
const OAUTH_ERRORS: Record<string, string> = {
  oauth: "Sign in with 42 failed. Please try again.",
  oauth_email_taken: "An account already uses your 42 email. Sign in with your password instead.",
};

// Sign-in page for visitors; signed-in users see the hub mounted by the root layout instead.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await getSession();

  if (!session) {
    const { error } = await searchParams;
    const initialError = typeof error === "string" ? OAUTH_ERRORS[error] : undefined;

    return (
      <>
        <Header />
        <SignInForm initialError={initialError} />
        <Footer />
      </>
    );
  }

  return null;
}
