import { describe, expect, it } from "vitest";
import { getBestAction } from "../srcs/ai/mcts";
import { DIFFICULTY_PRESETS } from "../srcs/ai/types";
import { damageSpell, filler, minion, newEngine } from "./helpers";

describe("MCTS AI", () => {
  it("always returns a legal action", async () => {
    const engine = newEngine(filler(15), filler(15));
    engine.startGame();
    const action = await getBestAction(engine, 50, 2);
    const legal = engine.getLegalActions().map(a => JSON.stringify(a));
    expect(legal).toContain(JSON.stringify(action));
  });

  it("takes lethal within its turn when it is on the board", async () => {
    const engine = newEngine(filler(15), filler(15));
    engine.startGame();
    engine.players[1].hero.currentHealth = 3;
    const attacker = minion(5, 5);
    engine.board.playMinion(0, attacker);
    attacker.canAttack = true;

    // Play the AI's turn the way GameSession does, until it ends its turn or wins. The order of
    // its moves is free (playing a card first and attacking after is just as lethal).
    for (let step = 0; step < 15 && !engine.isTerminal() && engine.currentTurn === 0; step++) {
      const action = await getBestAction(engine, 200, 2);
      if (action.type === "endTurn") break;
      if (action.type === "playCard") {
        const card = engine.players[0].hand.getCards()[action.cardIndex];
        const effect = engine.getOnPlayEffect(card);
        const targets = new Map();
        if (effect) targets.set(effect, action.targetIndex !== undefined ? engine.getOnPlayTargets(card)[action.targetIndex] : null);
        engine.playCard(action.cardIndex, targets);
      } else {
        const target = action.targetIndex === -1 ? engine.players[1].hero : engine.board.getMinions(1)[action.targetIndex];
        engine.attackWithMinion(action.attackerIndex, target);
      }
    }
    expect(engine.getWinner()).toBe(0);
  });

  it("uses a targeted spell on the enemy hero for lethal", async () => {
    const engine = newEngine(filler(15), filler(15));
    engine.startGame();
    engine.players[0].hand.add(damageSpell(5, 0));
    engine.players[1].hero.currentHealth = 4;

    const action = await getBestAction(engine, 300, 2);
    expect(action.type).toBe("playCard");
  });

  it("difficulty presets scale the search effort", () => {
    const { facile, moyen, difficile } = DIFFICULTY_PRESETS;
    expect(facile.simulations * facile.worlds).toBeLessThan(moyen.simulations * moyen.worlds);
    expect(moyen.simulations * moyen.worlds).toBeLessThan(difficile.simulations * difficile.worlds);
  });
});

describe("human-like policy", () => {
  it("easy AI sometimes misplays, hard AI never does", async () => {
    const { chooseAiAction } = await import("../srcs/ai/policy");
    const engine = newEngine(filler(15), filler(15));
    engine.startGame();

    // random() = 0 → below any positive mistakeRate: easy picks a random sensible move.
    const easy = await chooseAiAction(engine, "facile", () => 0);
    expect(easy.type).not.toBe("endTurn");

    // Same roll on hard (mistakeRate 0) goes through the search, which still returns a legal move.
    const hard = await chooseAiAction(engine, "difficile", () => 0);
    expect(engine.getLegalActions().map(a => JSON.stringify(a))).toContain(JSON.stringify(hard));
  });

  it("thinks for a variable, bounded time", async () => {
    const { thinkingTime } = await import("../srcs/ai/policy");
    expect(thinkingTime("facile", () => 0)).toBe(DIFFICULTY_PRESETS.facile.thinkMs[0]);
    expect(thinkingTime("facile", () => 1)).toBe(DIFFICULTY_PRESETS.facile.thinkMs[1]);
  });
});
