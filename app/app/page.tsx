import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SignInForm from "@/components/SignInForm";
import HubSceneLoader from "./HubSceneLoader";
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

  const user = await prisma.user.findUnique({
    where:  { id: session.userId },
    select: {
      username: true,
      wins:     true,
      cards:    { select: { qty: true } },
    },
  });

  // Nombre total de cartes possédées (copies comprises), pas le nombre de cartes distinctes.
  const cardCount = user?.cards.reduce((sum, c) => sum + c.qty, 0) ?? 0;

  return (
    <HubSceneLoader
      username={user?.username ?? session.username}
      cardCount={cardCount}
      wins={user?.wins ?? 0}
    />
  );
}
