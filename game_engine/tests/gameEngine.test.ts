import { describe, expect, it } from "vitest";
import { damageSpell, filler, minion, newEngine } from "./helpers";

describe("game start", () => {
  it("deals 3 cards to the first player and 4 to the second, then starts turn 1", () => {
    const engine = newEngine();
    engine.startGame();
    // Player 0 also drew for the start of their turn.
    expect(engine.players[0].hand.size()).toBe(4);
    expect(engine.players[1].hand.size()).toBe(4);
    expect(engine.currentTurn).toBe(0);
    expect(engine.players[0].currentMana).toBe(1);
  });
});

describe("mana", () => {
  it("grows by one per turn up to 7", () => {
    const engine = newEngine(filler(30), filler(30));
    engine.startGame();
    for (let i = 0; i < 20; i++) engine.endTurn();
    expect(engine.players[0].maxMana).toBe(7);
    expect(engine.players[1].maxMana).toBe(7);
  });

  it("refuses a card the player can't afford", () => {
    const engine = newEngine([minion(5, 5, 5), ...filler(9)]);
    engine.startGame();
    const index = engine.players[0].hand.getCards().findIndex(c => c.manaCost === 5);
    expect(engine.playCard(index, new Map()).success).toBe(false);
  });
});

describe("board", () => {
  it("holds at most 6 minions per side", () => {
    const engine = newEngine(filler(20), filler(20));
    engine.startGame();
    const player = engine.players[0];
    player.maxMana = player.currentMana = 99;
    for (let i = 0; i < 6; i++) player.hand.add(minion(1, 1, 0));
    for (let i = 0; i < 6; i++) expect(engine.playCard(0, new Map()).success).toBe(true);
    player.hand.add(minion(1, 1, 0));
    expect(engine.playCard(0, new Map()).success).toBe(false);
    expect(engine.board.getMinions(0)).toHaveLength(6);
  });
});

describe("combat", () => {
  it("minions trade damage and dead ones leave the board", () => {
    const engine = newEngine();
    const attacker = minion(3, 2);
    const defender = minion(2, 3);
    engine.board.playMinion(0, attacker);
    engine.board.playMinion(1, defender);
    attacker.canAttack = true;

    expect(engine.attackWithMinion(0, defender).success).toBe(true);
    expect(engine.board.getMinions(0)).toHaveLength(0); // 2 damage on a 2-health attacker
    expect(engine.board.getMinions(1)).toHaveLength(0); // 3 damage on a 3-health defender
  });

  it("a minion attacks once per turn", () => {
    const engine = newEngine();
    const attacker = minion(1, 5);
    engine.board.playMinion(0, attacker);
    attacker.canAttack = true;
    expect(engine.attackWithMinion(0, engine.players[1].hero).success).toBe(true);
    expect(engine.attackWithMinion(0, engine.players[1].hero).success).toBe(false);
    expect(engine.players[1].hero.currentHealth).toBe(19);
  });

  it("taunt minions must be attacked first", () => {
    const engine = newEngine();
    engine.startGame();
    engine.board.playMinion(0, minion(1, 1));
    engine.board.playMinion(1, minion(0, 5, 1, { taunt: true }));
    engine.board.getMinions(0)[0].canAttack = true;

    const attacks = engine.getLegalActions().filter(a => a.type === "attack");
    // Only the taunt minion (index 0 of the enemy board) is a legal target, not the hero (-1).
    expect(attacks).toEqual([{ type: "attack", attackerIndex: 0, targetIndex: 0 }]);
  });
});

describe("spells and win condition", () => {
  it("a damage spell can finish the enemy hero and the game has a winner", () => {
    const engine = newEngine();
    engine.startGame();
    engine.players[0].hand.add(damageSpell(20, 0)); // decks are shuffled: put it in hand directly
    const hand = engine.players[0].hand.getCards();
    const spellIndex = hand.findIndex(c => c.name === "Test spell");
    const effect = engine.getOnPlayEffect(hand[spellIndex])!;

    const result = engine.playCard(spellIndex, new Map([[effect, engine.players[1].hero]]));
    expect(result.success).toBe(true);
    expect(engine.isTerminal()).toBe(true);
    expect(engine.getWinner()).toBe(0);
  });
});

describe("fatigue", () => {
  it("drawing from an empty deck deals increasing damage", () => {
    const engine = newEngine([], []);
    const player = engine.players[0];
    player.drawCard();
    player.drawCard();
    expect(player.hero.currentHealth).toBe(20 - 1 - 2);
  });
});

describe("clone", () => {
  it("simulating on a clone never touches the real game (AI search relies on it)", () => {
    const engine = newEngine();
    engine.startGame();
    const copy = engine.clone();
    copy.players[1].hero.takeDamage(10);
    copy.endTurn();
    expect(engine.players[1].hero.currentHealth).toBe(20);
    expect(engine.currentTurn).toBe(0);
  });
});
