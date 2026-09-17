import { getSession } from "@/lib/auth/cookieSession";
import Header from "@/components/auth-forms/Header";
import Footer from "@/components/auth-forms/Footer";
import SignInForm from "@/components/auth-forms/SignInForm";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <Header />
        <SignInForm />
        <Footer />
     </>
    );
  }

  // The hub itself is rendered by HubBackground in the root layout (mounted once, never
  // unmounted between visits to "/" — see layout.tsx and HubBackground.tsx): this page has
  // nothing left to render for a logged-in user.
  return null;
}
