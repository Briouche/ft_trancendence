import { getSession } from "@/lib/session";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignInForm from "@/components/SignInForm";

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
