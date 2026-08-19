import PhaserLoader from "@/components/game/PhaserLoader";
import type { GameMode } from "@/game/GameConfig";

export default async function PlayGamePage({ searchParams }: { searchParams: Promise<{ mode?: string }> })
{
  const params = await searchParams;
  const mode: GameMode = params.mode === "solo" ? "solo" : "multiplayer";

  return (
    <div>
      <PhaserLoader mode={mode} />
    </div>
  );
}