import { getSession } from "@/lib/session";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignInForm from "@/components/SignInForm";
import EntranceRoomLoader from "./EntranceRoomLoader";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    return (
      <EntranceRoomLoader>
        <Header />
        <SignInForm />
        <Footer />
      </EntranceRoomLoader>
    );
  }

  // Le hub lui-même est rendu par HubBackground dans le layout racine (monté une seule fois,
  // jamais démonté entre deux visites de "/" — voir layout.tsx et HubBackground.tsx) : cette
  // page n'a plus rien à afficher pour un utilisateur connecté.
  return null;
}
