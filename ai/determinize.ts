
// The AI can't see the opponent's actual hand — that's "hidden information."
// Instead of guessing blindly, this fills the opponent's hand with a random,
// plausible set of cards so the AI can still reason about "what if they have X".
// This gets called once per "world" — see mcts.ts for what a world is.

import { GameEngine } from "../gameEngine/srcs/gameEngine";
import { Player } from "../gameEngine/srcs/player";
import { Card } from "../gameEngine/srcs/card";
import { loadAllCards, makeDeckFromIds } from "../gameEngine/srcs/cardLoader";
import { shuffle, replaceHand } from "./utils";

export function determinize(engine: GameEngine, currentPlayerIdx: 0 | 1): GameEngine 
{
  const clone = engine.clone();
  const opponentIdx: 0 | 1 = currentPlayerIdx === 0 ? 1 : 0;
  const opponent: Player = clone.players[opponentIdx];
  const hiddenCount = opponent.hand.size();

  const ids = shuffle(loadAllCards().map(c => c.id)).slice(0, hiddenCount);
  const sampledDeck = makeDeckFromIds(ids);

  const sampled: Card[] = [];
  for (let i = 0; i < hiddenCount; i++) 
  {
    const c = sampledDeck.draw();
    if (c) sampled.push(c);
  }
  replaceHand(opponent.hand, sampled);
  return clone;
}