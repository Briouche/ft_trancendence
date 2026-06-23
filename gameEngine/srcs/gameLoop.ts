import * as readline from "readline";
import { GameEngine } from "./gameEngine";
import { Hero }       from "./hero";
import { Player }     from "./player";
import { Deck, makeBasicDeck }       from "./deck";
import { render, printMessage, printCommands } from "./display";

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
        engine.playCard(cardIndex);
        return;
    }

    if (command === "a")
    {
        const attackerIndex: number = parseInt(parts[1]);
        const targetIndex:   number = parseInt(parts[2]);
        if (isNaN(attackerIndex) || isNaN(targetIndex))
        {
            printMessage("Usage: a <attackerIndex> <targetIndex>  (-1 = enemy hero)");
            return;
        }
        engine.attackWithMinion(attackerIndex, targetIndex);
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
