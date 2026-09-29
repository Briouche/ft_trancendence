import { getSession } from "@/lib/auth/cookieSession";
import Header from "@/components/auth-forms/Header";
import Footer from "@/components/auth-forms/Footer";
import SignInForm from "@/components/auth-forms/SignInForm";
import { OAUTH_SIGN_IN_ERRORS, oauthMessage } from "@/lib/auth/oauthMessages";

/** Sign-in page for visitors; signed-in users see the hub mounted by the root layout instead. */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await getSession();
  if (session) return null;

  const initialError = oauthMessage(OAUTH_SIGN_IN_ERRORS, await searchParams);
  return (
    <>
      <Header />
      <SignInForm initialError={initialError} />
      <Footer />
    </>
  );
}
