import { getSession } from "@/lib/auth/cookieSession";
import Header from "@/components/auth-forms/Header";
import Footer from "@/components/auth-forms/Footer";
import SignInForm from "@/components/auth-forms/SignInForm";

// Sign-in page for visitors; signed-in users see the hub mounted by the root layout instead.
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

  return null;
}
