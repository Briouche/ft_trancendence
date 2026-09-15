import { Hand } from "../hand";
import { Card } from "../card";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function replaceHand(hand: Hand, newCards: Card[]): void {
  while (!hand.isEmpty()) hand.play(0);
  for (const c of newCards) hand.add(c);
}
