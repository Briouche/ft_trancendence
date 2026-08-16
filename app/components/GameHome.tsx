import { getSession } from "@/lib/session";

export default async function GameHome() {
  const session = await getSession();

  return (
    <div>
      Here will come the game

      <p className="text-center text-sm text-muted-foreground">
        You&apos;re already signed in as {session ? session.username : ""}.
      </p>
    </div>);
}
