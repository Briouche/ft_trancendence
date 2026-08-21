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

export interface ClientHero
{
    id: string;
    name: string;
    health: number;
    maxHealth?: number;
}

export interface ClientGameState 
{
    yourTurn: boolean;
    playerHero: ClientHero;
    opponentHero: ClientHero;
    playerHand: ClientCard[];
    opponentHandCount: number;
    playerBoard: ClientCard[];
    opponentBoard: ClientCard[];
    pendingPrompt?: TargetPrompt;
    mana: number;
    maxMana: number;
    playerDeck: number;
    opponentDeck: number;
}

export type GameEvent = { type: "attack"; attackerId: string; targetId: string; playerIndex: 0 | 1; }
    | { type: "damage"; targetId: string; amount: number; targetDied: boolean }
    | { type: "cardPlayed"; cardId: string; playerIndex: 0 | 1; boardIndex?: number }
    | { type: "minionDied"; minionId: string; playerIndex: 0 | 1 }
    | { type: "turnEnded"; nextPlayerIndex: 0 | 1 }
    | { type: "cardDrawn"; playerIndex: 0 | 1; cardId?: string };

export type TargetOption = { type: "hero"; id: string; }
    | { type: "minion"; id: string; }

export interface TargetPrompt
{
    forCardId: string;
    options: TargetOption[];
}

export type ClientMessage = { type: "ready" }
    | { type: "playCard"; cardId: string; boardIndex?: number; }
    | { type: "attack"; attackerId: string; targetId: string; }
    | { type: "targetChoice"; targetId: string | null }
    | { type: "endTurn" };

export type ServerMessage = { type: "assigned"; playerIndex: 0 | 1 }
    | { type: "state"; state: ClientGameState }
    | { type: "event"; event: GameEvent }
    | { type: "prompt"; prompt: TargetPrompt }
    | { type: "rejected"; reason: string }
    | { type: "gameOver"; winner: "you" | "opponent" };
