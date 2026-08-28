export interface ClientCard
{
    id: string;
    name: string;
    cost: number;
    attack?: number;
    health?: number;
    canAttack?: boolean;
    description: string;
    requiresTarget: boolean
}

export interface ClientGameState 
{
    yourTurn: boolean;
    playerHero: number;
    opponentHero: number;
    playerHand: ClientCard[];
    opponentHandCount: number;
    playerBoard: ClientCard[];
    opponentBoard: ClientCard[];
    pendingPrompt?: TargetPrompt;
    mana: number;
    maxMana: number;
    playerDeck: number;
    opponentDeck:number;
}

export type Difficulty = "facile" | "moyen" | "difficile";

export type TargetOption = { type: "hero"; id: string; }
                            | { type: "minion"; id: string; }

export interface TargetPrompt
{
    forCardId: string;
    options: TargetOption[];
}

export type ClientMessage = { type: "ready" }
                            | { type: "readySolo"; difficulty: Difficulty }
                            | { type: "playCard"; cardId: string; boardIndex?: number; }
                            | { type: "attack"; attackerId: string; targetId: string; }
                            | { type: "targetChoice"; targetId: string | null }
                            | { type: "endTurn" };

export type ServerMessage = { type: "assigned"; playerIndex: 0 | 1 }
                            | { type: "state"; state: ClientGameState }
                            | { type: "prompt"; prompt: TargetPrompt }
                            | { type: "rejected"; reason: string }
                            | { type: "gameOver"; winner: "you" | "opponent" };

