export interface clientEffect
{
    taunt?: boolean;
    deathrattle?: boolean;
    startOfTurn?: boolean;
    endOfTurn?: boolean;
    onAttack?: boolean;
    onDamage?: boolean;
    battlecry?: boolean;
    rush?: boolean;
    archi?: boolean;
}

export interface ClientCard
{
    id: string;
    name: string;
    assetKey: string;
    rarity: string;
    cost: number;
    attack?: number;
    health?: number;
    maxHealth?: number;
    baseAttack?: number;
    baseHealth?: number;
    canAttack?: boolean;
    description: string;
    requiresTarget: boolean;
    effects: clientEffect;
}

export interface ClientHero
{
    id: string;
    name: string;
    health: number;
    maxHealth?: number;
    archi?: number;
    freddy?: number;
    roiDesRats?: number;
    gertrude?: number;
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
    | { type: "heal"; targetId: string; amount: number }
    | { type: "buff"; targetId: string; attackDelta: number; healthDelta: number }
    | { type: "cardPlayed"; cardId: string; playerIndex: 0 | 1; boardIndex?: number; card: ClientCard }
    | { type: "summon"; minionId: string; playerIndex: 0 | 1; boardIndex?: number; card: ClientCard }
    | { type: "minionDied"; minionId: string; playerIndex: 0 | 1 }
    | { type: "effect"; minionId: string; playerIndex: 0 | 1; trigger: "passive" | "battlecry" | "deathrattle" }
    | { type: "turnEnded"; nextPlayerIndex: 0 | 1 }
    | { type: "cardDrawn"; playerIndex: 0 | 1; cardId?: string };

export type TargetOption = { type: "hero"; id: string; }
    | { type: "minion"; id: string; }

export interface TargetPrompt
{
    forCardId: string;
    options: TargetOption[];
}

export type Difficulty = "facile" | "moyen" | "difficile";

export type ClientMessage = { type: "ready"; deckId: number }
                            | { type: "readySolo"; difficulty: Difficulty; deckId: number }
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
