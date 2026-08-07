export interface ClientCard { id: string; name: string; cost: number; attack?: number; health?: number; canAttack?: boolean; description: string}

export interface ClientGameState 
{
    yourTurn: boolean;
    playerHero: { health: number };
    opponentHero: { health: number };
    playerHand: ClientCard[];
    opponentHandCount: number;
    playerBoard: ClientCard[];
    opponentBoard: ClientCard[];
    pendingPrompt?: TargetPrompt;
}

export interface TargetOption { id: string; label: string; kind: "hero" | "minion"; }
export interface TargetPrompt { forCardId: string; options: TargetOption[]; }

export type ClientMessage = { type: "playCard"; cardId: string; boardIndex?: number }
                            | { type: "attack"; attackerId: string; targetId: string }
                            | { type: "targetChoice"; targetId: string | null }
                            | { type: "endTurn" };

export type ServerMessage = { type: "state"; state: ClientGameState }
                            | { type: "prompt"; prompt: TargetPrompt }
                            | { type: "rejected"; reason: string }
                            | { type: "gameOver"; winner: "you" | "opponent" };

