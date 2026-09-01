import PhaserLoader from "@/components/game/PhaserLoader";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

export default async function PlayGamePage({ searchParams }: { searchParams: Promise<{ mode?: string; difficulty?: string }> }) {
  const params = await searchParams;
  const mode: GameMode = params.mode === "solo" ? "solo" : "multiplayer";
  const difficulty: Difficulty = (params.difficulty as Difficulty) ?? "moyen";

  return (
    <div>
      <PhaserLoader mode={mode} difficulty={difficulty} />
    </div>
  );
}

