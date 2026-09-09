import { GameEngine } from "../gameEngine";
import { Player } from "../player";
import { Card } from "../card";
import { shuffle, replaceHand } from "./utils";
import { Deck } from "../deck"

export async function determinize(engine: GameEngine, currentPlayerIdx: 0 | 1): Promise<GameEngine>
{
  const clone = engine.clone();
  const opponentIdx: 0 | 1 = currentPlayerIdx === 0 ? 1 : 0;
  const opponent: Player = clone.players[opponentIdx];

  const hiddenCount = opponent.hand.size();
  const pool: Card[] = [...opponent.hand.getCards(), ...opponent.deck.getCards()];

  const shuffled = shuffle(pool);
  const sampledHand = shuffled.slice(0, hiddenCount);
  const remainingDeck = shuffled.slice(hiddenCount);

  replaceHand(opponent.hand, sampledHand);
  opponent.deck = new Deck(remainingDeck);

  return clone;
}
