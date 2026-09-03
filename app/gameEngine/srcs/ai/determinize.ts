import { GameEngine } from "../gameEngine";
import { Player } from "../player";
import { Card } from "../card";
import { loadAllCards, makeDeckFromIds } from "../cardImport/cardLoader";
import { shuffle, replaceHand } from "./utils";
import { Deck } from "../deck"

export async function determinize(engine: GameEngine, currentPlayerIdx: 0 | 1): Promise<GameEngine>
{
  const clone = engine.clone();
  const opponentIdx: 0 | 1 = currentPlayerIdx === 0 ? 1 : 0;
  const opponent: Player = clone.players[opponentIdx];
  const hiddenCount = opponent.hand.size();

  const allCards = await loadAllCards();
  const ids: string[] = shuffle(allCards.map(c => c.id)).slice(0, hiddenCount);
  const sampledDeck: Deck = await makeDeckFromIds(ids);

  const sampled: Card[] = [];
  for (let i = 0; i < hiddenCount; i++)
  {
    const c = sampledDeck.draw();
    if (c) sampled.push(c);
  }
  replaceHand(opponent.hand, sampled);
  return clone;
}
