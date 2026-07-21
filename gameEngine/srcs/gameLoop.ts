import * as readline from "readline";
import { GameEngine } from "./gameEngine";
import { Hero }       from "./hero";
import { Player }     from "./player";
import { Deck, makeBasicDeck }       from "./deck";
import { render, printMessage, printCommands, printTargetList } from "./display";
import { Card, MinionCard, SpellCard } from "./card";
import { Effect } from "./effect";
import { Targetable, EnemyCharacterResolver } from "./target";

const rl = readline.createInterface({ input:  process.stdin, output: process.stdout });

function ask(prompt: string): Promise<string>
{
    return new Promise((resolve) =>
    {
        rl.question(prompt, (answer: string) =>
        {
            resolve(answer.trim());
        });
    });
}

function isGameOver(engine: GameEngine): boolean
{
    return !engine.players[0].hero.isAlive() || !engine.players[1].hero.isAlive();
}

async function askForTarget(validTargets: Targetable[]): Promise<Targetable | null>
{
    printTargetList(validTargets);

    const input: string = await ask("  > ");

    if (input === "q")
        return null;

    const index: number = parseInt(input);

    if (isNaN(index) || index < 0 || index >= validTargets.length)
    {
        printMessage("Invalid target.");
        return null;
    }

    return validTargets[index];
}

function getOnPlayEffectsFromCard(card: Card): Effect[]
{
    let effects: Effect[] = [];

    if (card instanceof SpellCard)
        effects.push(card.effect);

    if (card instanceof MinionCard && card.effects.battlecry)
        effects.push(card.effects.battlecry);

    return (effects);
}

async function collectTargets(card: Card, engine: GameEngine): Promise<Map<Effect, Targetable | null> | null>
{
    const result = new Map<Effect, Targetable | null>();
    const effects: Effect[] = getOnPlayEffectsFromCard(card);

    for (const effect of effects)
    {
        if (!effect.resolver || !effect.resolver.requiresInput)
        {
            result.set(effect, null);
            continue;
        }

        const validTargets = effect.resolver.resolve({engine: engine, owner: engine.activePlayer(), source: card});

        if (validTargets.length === 0)
            return null;

        const chosen = await askForTarget(validTargets);

        if (chosen === null)
            return null;

        result.set(effect, chosen);
    }

    return result;
}

async function handlePlayCard(cardIndex: number, engine: GameEngine): Promise<void> 
{
   const card = engine.activePlayer().hand.getCards()[cardIndex];

   const targets = await collectTargets(card, engine);
    if (targets === null)
        return;
    engine.playCard(cardIndex, targets);
}

async function handleAttack(attackerIndex: number, engine: GameEngine): Promise<void>
{
    const attacker = engine.board.getMinions(engine.currentTurn)[attackerIndex];

    if (!attacker || !attacker.canAttack)
        return;

    const resolver: EnemyCharacterResolver = new EnemyCharacterResolver();
    const targets: Targetable[] = resolver.resolve({engine: engine, owner: engine.activePlayer(), source: attacker});

    if (targets.length === 0)
        return;

    const target = await askForTarget(targets);
    if (target === null)
        return;

    engine.attackWithMinion(attackerIndex, target);
}

async function handleCommand(input: string, engine: GameEngine): Promise<void>
{
    const parts: string[] = input.split(" ");
    const command: string = parts[0];

    if (command === "e")
    {
        engine.endTurn();
        return;
    }

    if (command === "p")
    {
        const cardIndex: number = parseInt(parts[1]);
        if (isNaN(cardIndex))
        {
            printMessage("Usage: p <cardIndex>");
            return;
        }
        await handlePlayCard(cardIndex, engine);
        return;
    }

    if (command === "a")
    {
        const attackerIndex: number = parseInt(parts[1]);

        if (isNaN(attackerIndex))
        {
            printMessage("Usage: a <attackerIndex> <targetIndex>  (-1 = enemy hero)");
            return;
        }
        await handleAttack(attackerIndex, engine);
        return;
    }

    printMessage("Unknown command. Commands: p <n>  |  a <n> <t>  |  e");
}

export async function gameLoop(): Promise<void>
{
    const player1: Player = new Player(new Hero("Stef"),  makeBasicDeck());
    const player2: Player = new Player(new Hero("Bribz"), makeBasicDeck());
    const engine: GameEngine = new GameEngine([player1, player2]);

    printCommands();
    engine.startGame();

    while (!isGameOver(engine))
    {
        render(engine);

        const input: string = await ask("  > ");

        await handleCommand(input, engine);

        if (isGameOver(engine))
        {
            render(engine);
            if (engine.players[0].hero.isAlive())
                printMessage("Game over! " + engine.players[0].hero.name + " wins!");
            else
                printMessage("Game over! " + engine.players[1].hero.name + " wins!");
            break;
        }
    }
    rl.close();
}
