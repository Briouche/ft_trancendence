import { GameEngine } from "../gameEngine";
import { Player }     from "../player";
import { MinionCard } from "../card";
import { Targetable } from "../target";


//display game in terminal, temp before graphic interface


const DIVIDER:      string = "=".repeat(60);
const THIN_DIVIDER: string = "-".repeat(60);

function clearScreen(): void
{
    process.stdout.write("\x1Bc");
}

function printHero(player: Player): string
{
    return player.hero.name
        + "  HP: " + player.hero.currentHealth + "/20"
        + "  Mana: " + player.currentMana + "/" + player.maxMana
        + "  Deck: " + player.deck.size();
}

function printBoard(engine: GameEngine): void
{
    let p1minions: MinionCard[];
    let p2minions: MinionCard[];

    if (engine.currentTurn == 0)
    {
        p1minions = engine.board.getMinions(0);
        p2minions = engine.board.getMinions(1);
    }
    else
    {
        p1minions = engine.board.getMinions(1);
        p2minions = engine.board.getMinions(0);
    }

    // opponent board (player 2)
    if (p2minions.length === 0)
        console.log("  (empty)");
    else
    {
        for (let i = 0; i < p2minions.length; i++)
        {
            const m = p2minions[i];
            console.log("  [" + i + "] " + m.name + " " + m.attack + "/" + m.currentHealth);
        }
    }

    console.log(THIN_DIVIDER);

    // active player board (player 1)
    if (p1minions.length === 0)
        console.log("  (empty)");
    else
    {
        for (let i = 0; i < p1minions.length; i++)
        {
            const m      = p1minions[i];
            const canAct = m.canAttack ? " [ready]" : " [asleep]";
            console.log("  [" + i + "] " + m.name + " " + m.attack + "/" + m.currentHealth + canAct);
        }
    }
}

function printHand(player: Player): void
{
    const cards = player.hand.getCards();
    if (cards.length === 0)
    {
        console.log("  (empty hand)");
        return;
    }
    for (let i = 0; i < cards.length; i++)
        console.log("  [" + i + "] " + cards[i].toString());
}

export function printCommands(): void
{
    console.log(THIN_DIVIDER);
    console.log("  p <n>        play card at index n");
    console.log("  a <n>        attack with minion n -> choose target after");
    console.log("  e            end turn");
    console.log(DIVIDER);
}

export function render(engine: GameEngine): void
{
    clearScreen();

    const active:   Player = engine.activePlayer();
    const opponent: Player = engine.players[engine.currentTurn === 0 ? 1 : 0];

    console.log(DIVIDER);
    console.log("  OPPONENT: " + printHero(opponent));
    console.log(DIVIDER);

    printBoard(engine);

    console.log(DIVIDER);
    console.log("  YOUR TURN: " + printHero(active));
    console.log(THIN_DIVIDER);
    console.log("  Hand:");
    printHand(active);
    printCommands();
}

export function printMessage(message: string): void
{
    console.log("  >> " + message);
}


export function printTargetList(targets: Targetable[]): void
{
    let index: number = 0;

    console.log(" >> Pick a target (or q to cancel):");
    console.log(THIN_DIVIDER);
    for (const target of targets)
    {
        console.log(" >> " + target.name + "[" + index++ + "]");
    }
    console.log(DIVIDER);
}
