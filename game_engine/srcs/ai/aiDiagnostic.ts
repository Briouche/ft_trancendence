// Standalone script: plays AI-vs-AI games and counts turns ended without attacking or with
// other options available. Run: npx ts-node srcs/ai/aiDiagnostic.ts <difficulty> <numGames> [--verbose]

import { GameEngine } from "../gameEngine";
import { Player } from "../player";
import { Hero } from "../hero";
import { makeBasicDeck } from "../deck";
import { getBestAction } from "./mcts";
import { DIFFICULTY_PRESETS, Difficulty } from "./types";

function makePlayer(index: 0 | 1, deckNo: number): Player {
  const hero = new Hero("Hero" + index, "hero" + index);
  const deck = makeBasicDeck("p" + index + "_", deckNo);
  return new Player(hero, deck, "p" + index, index);
}

interface GameStats {
  turns: number;
  totalActions: number;
  attacksMade: number;
  turnsWithAttackOpportunity: number;
  turnsWhereAttackWasSkipped: number;
  immediateEndTurnsWithOtherOptions: number;
  winner: 0 | 1 | null;
  log: string[];
}

async function playOneGame(difficulty: Difficulty, verbose: boolean): Promise<GameStats> {
  const { simulations, worlds } = DIFFICULTY_PRESETS[difficulty];
  const engine = new GameEngine([makePlayer(0, 0), makePlayer(1, 2)]);
  engine.startGame();

  const stats: GameStats = {
    turns: 0, totalActions: 0, attacksMade: 0,
    turnsWithAttackOpportunity: 0, turnsWhereAttackWasSkipped: 0,
    immediateEndTurnsWithOtherOptions: 0, winner: null, log: [],
  };

  let isFirstActionOfTurn = true;
  let hadAttackOptionThisTurn = false;
  let attackedThisTurn = false;
  const MAX_TOTAL_ACTIONS = 1500;

  while (!engine.isTerminal() && stats.totalActions < MAX_TOTAL_ACTIONS) {
    const legal = engine.getLegalActions();
    const attackOptionsAvailable = legal.some(a => a.type === "attack");
    if (attackOptionsAvailable) hadAttackOptionThisTurn = true;

    const action = await getBestAction(engine, simulations, worlds);
    stats.totalActions++;

    if (isFirstActionOfTurn && action.type === "endTurn" && legal.length > 1) {
      stats.immediateEndTurnsWithOtherOptions++;
      if (verbose) stats.log.push(
        `turn ${stats.turns} player ${engine.currentTurn}: ended turn immediately with ${legal.length - 1} other option(s) available ` +
        `(hand=${engine.activePlayer().hand.size()}, mana=${engine.activePlayer().currentMana}, board=${engine.board.getMinions(engine.currentTurn).length})`
      );
    }
    isFirstActionOfTurn = false;

    if (action.type === "attack") { stats.attacksMade++; attackedThisTurn = true; }

    switch (action.type) {
      case "playCard": {
        const player = engine.activePlayer();
        const card = player.hand.getCards()[action.cardIndex];
        const targets = new Map();
        const effect = engine.getOnPlayEffect(card);
        if (effect) {
          const target = action.targetIndex !== undefined
            ? engine.getOnPlayTargets(card)[action.targetIndex] ?? null
            : null;
          targets.set(effect, target);
        }
        engine.playCard(action.cardIndex, targets);
        break;
      }
      case "attack": {
        const opponentIdx = engine.currentTurn === 0 ? 1 : 0;
        const target = action.targetIndex === -1
          ? engine.players[opponentIdx].hero
          : engine.board.getMinions(opponentIdx)[action.targetIndex];
        engine.attackWithMinion(action.attackerIndex, target);
        break;
      }
      case "endTurn": {
        if (hadAttackOptionThisTurn) {
          stats.turnsWithAttackOpportunity++;
          if (!attackedThisTurn) {
            stats.turnsWhereAttackWasSkipped++;
            if (verbose) stats.log.push(
              `turn ${stats.turns} player ${engine.currentTurn}: had attackable minion(s) but never attacked before ending turn`
            );
          }
        }
        engine.endTurn();
        stats.turns++;
        isFirstActionOfTurn = true;
        hadAttackOptionThisTurn = false;
        attackedThisTurn = false;
        break;
      }
    }
  }

  stats.winner = engine.getWinner();
  return stats;
}

async function main() {
  const difficulty: Difficulty = (process.argv[2] as Difficulty) || "facile";
  const numGames = parseInt(process.argv[3] || "5", 10);
  const verbose = process.argv.includes("--verbose");

  console.log(`Running ${numGames} game(s) at difficulty=${difficulty}\n`);

  const agg = { turns: 0, attacksMade: 0, turnsWithOpp: 0, turnsSkipped: 0, immediateEnds: 0 };

  for (let g = 0; g < numGames; g++) {
    const stats = await playOneGame(difficulty, verbose);
    agg.turns += stats.turns;
    agg.attacksMade += stats.attacksMade;
    agg.turnsWithOpp += stats.turnsWithAttackOpportunity;
    agg.turnsSkipped += stats.turnsWhereAttackWasSkipped;
    agg.immediateEnds += stats.immediateEndTurnsWithOtherOptions;

    console.log(`Game ${g}: turns=${stats.turns} totalActions=${stats.totalActions} attacksMade=${stats.attacksMade} ` +
      `turnsWithAttackOpportunity=${stats.turnsWithAttackOpportunity} turnsWhereAttackSkipped=${stats.turnsWhereAttackWasSkipped} ` +
      `immediateEndTurnsWithOtherOptions=${stats.immediateEndTurnsWithOtherOptions} winner=${stats.winner}`);
    if (verbose) for (const line of stats.log) console.log("  " + line);
  }

  console.log("\n--- aggregate ---");
  console.log(`total turns: ${agg.turns}`);
  console.log(`total attacks made: ${agg.attacksMade}`);
  console.log(`turns with an attack opportunity: ${agg.turnsWithOpp}`);
  console.log(`turns where attack was available but skipped entirely: ${agg.turnsSkipped} ` +
    `(${agg.turnsWithOpp ? ((agg.turnsSkipped / agg.turnsWithOpp) * 100).toFixed(1) : 0}%)`);
  console.log(`immediate end-turns despite other options: ${agg.immediateEnds}`);
}

main().catch(e => { console.error(e); process.exit(1); });
