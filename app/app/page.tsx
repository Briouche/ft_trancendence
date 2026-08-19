import { getSession } from "@/lib/session";
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

  return <HubSceneLoader />;
}
