import Footer from "@/components/Footer";
import GameHome from "@/components/GameHome";
import Header from "@/components/Header";
import SignInForm from "@/components/SignInForm";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();

  return (
    <>
      <Header />

      <main className="flex flex-1 flex-col items-center justify-center p-vertical">
        {session ? (
        <GameHome />
      ) : (
        <div><SignInForm /></div>
      )}
    </main>

    <Footer />
  </>
);
}
