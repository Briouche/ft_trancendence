import { MinionCard, SpellCard } from "./card";
import { Hero } from "./hero";

function simulateCombat(attacker: MinionCard, defender: MinionCard, hero: Hero): void
{
    console.log("=== Combat Start ===");
    console.log("Attacker: " + attacker.PrintCard());
    console.log("Defender: " + defender.PrintCard());
    console.log("Hero:      " + hero.printHero());
    console.log("");

    attacker.takeDamage(defender.attack);
    defender.takeDamage(attacker.attack);

    console.log("After combat:");
    console.log("  " + attacker.name + " -> " + attacker.currentHealth + " HP");
    console.log("  " + defender.name + " -> " + defender.currentHealth + " HP");
    console.log("");

    const attackerAlive: boolean = attacker.isAlive();
    const defenderAlive: boolean = defender.isAlive();

    if (!attackerAlive && !defenderAlive)
    {
        console.log("Both minions died. No one attacks the hero.");
        return;
    }

    if (!attackerAlive)
    {
        console.log(attacker.name + " died.");
        console.log(defender.name + " survived and attacks " + hero.name + "!");
        hero.takeDamage(defender.attack);
		vampiricTouch.effect({minion : defender, hero : hero});
    }
    else
    {
        console.log(defender.name + " died.");
        console.log(attacker.name + " survived and attacks " + hero.name + "!");
        hero.takeDamage(attacker.attack);
		vampiricTouch.effect({minion : attacker, hero : hero});
    }

    console.log("");
    console.log("=== Result ===");
    console.log(hero.printHero());

    if (!hero.isAlive())
        console.log(hero.name + " has been destroyed!");
}


const thon:    MinionCard = new MinionCard("Le *gros* thon-poli", 4, "bonjouuuuur, un cookie?", 4, 5);
const couz: MinionCard = new MinionCard("Cousin hyperactif",      1, "BRAAAAAHHFSKHBSKDHBVvhbcbdizHVKBV. hahaAAAAAAHAAAAAaaaa",      2, 1);
const hero:   Hero       = new Hero("le Roi des rats");

const vampiricTouch: SpellCard = new SpellCard("Vampiric Touch", 3, "Deal 3 damage to a minion. Restore 3 HP to your hero.",
    (targets: { minion: MinionCard, hero: Hero }) =>
    {
        targets.minion.takeDamage(3);
        targets.hero.heal(3);
        console.log("Vampiric Touch hits " + targets.minion.name + " for 3 damage!");
        console.log(targets.hero.name + " heals for 3 HP -> " + targets.hero.currentHealth + " HP");
    }
);

simulateCombat(thon, couz, hero);
