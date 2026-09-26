import { Card, SpellCard, MinionCard } from "./card";
import { AddEffectfEffect, archiDamageEffect, BuffEffect, CombinedEffect, DamageEffect, DrawCardEffect, HealEffect, RandomMissileEffect, SummonMinionEffect, timmyDamageEffect, triggerDeathrattleEffect } from "./effect";
import { AlliedMinionsResolver, AllMinionsResolver, AnyCharacterResolver, EnemyHeroResolver, NeighboringMinionsResolver, OtherAlliedMinionsResolver, RandomEnemyResolver } from "./target";

// A player's draw pile.
export class Deck
{
    private cards: Card[];

    constructor(cards: Card[] = [])
    {
        this.cards = [...cards];
    }

    // Fisher-Yates
    shuffle(): void
    {
        for (let i = this.cards.length - 1; i > 0; i--)
        {
            const j: number = Math.floor(Math.random() * (i + 1));
            const temp: Card = this.cards[i];
            this.cards[i]    = this.cards[j];
            this.cards[j]    = temp;
        }
    }

    draw(): Card | null
    {
        if (this.cards.length === 0)
            return null;
        return this.cards.pop()!;
    }

    getCards(): Card[]
    {
        return this.cards;
    }

    size(): number
    {
        return this.cards.length;
    }

    isEmpty(): boolean
    {
        return this.cards.length === 0;
    }

    clone(): Deck
    {
        return new Deck(this.cards.map(card => card.cloneCopy()));
    }
}

// Hardcoded fixture decks for ai/aiDiagnostic.ts only; real matches load decks from the DB
// (cardImport/cardLoader.ts, cardImport/aiDecks.ts).
export function makeBasicDeck(player: string, deckNo: number = 0): Deck
{
    const deck1 = new Deck ([
        new MinionCard(player + "20", "Timmy ", 4, "passive: hero can have more health, active: deal damage = to above 20", 4, 4, { battlecry: new timmyDamageEffect(new AnyCharacterResolver()) }, "timmy"),
        new MinionCard(player + "18", "Flagbearer", 3, "whenever this attacks, buff its neighbors by 1/1", 3, 3, { onAttack: new BuffEffect(1, 1, new NeighboringMinionsResolver()) }),
        new MinionCard(player + "17", "lantern", 2, "at the start of your turn, draw 1 card", 0, 4, { startOfTurnEffect: new DrawCardEffect(1) }),
        new MinionCard(player + "0", "Ragnaros", 3, "at the end of your turn deal 4 damage to a random enemy", 2, 2, { endOfTurnEffect: new RandomMissileEffect(1, 4, new RandomEnemyResolver()) }),
        new MinionCard(player + "1", "DrawingWisp",  0, "battlecry: draw 1.",     1, 1, { battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "2", "Rushy River Croc",   2, "Snappy.", 2, 3, {rush: true, taunt: true}),
        new MinionCard(player + "3", "TauntMurloc", 1, "Taunt", 2, 2, {taunt: true}),
        new MinionCard(player + "5", "gros Thon poli", 3, "heal 2hp", 4, 5, {taunt: true, battlecry: new HealEffect(2, new AnyCharacterResolver())}),
        new MinionCard(player + "6", "Argus", 2, "buff neighbors +1/+1 taunt", 2, 2,
            {battlecry: new CombinedEffect([new BuffEffect(1, 1, new NeighboringMinionsResolver()), new AddEffectfEffect(true, "taunt", new NeighboringMinionsResolver())])}),
        new MinionCard(player + "7", "Mother Spider", 2, "deathrattle: summon 2 1/1 spider baby's", 1, 1,
            {deathrattle: new SummonMinionEffect( [new MinionCard(player + "7.1", "baby spider", 0, "small and spidery", 1, 1), new MinionCard(player + "7.2", "baby spider", 0, "small and spidery", 1, 1)], 2)}),
        new MinionCard(player + "10", "GoblinFeeder", 3, "gives all friendly minions +1/+1", 2, 2, {battlecry: new BuffEffect(1, 1, new OtherAlliedMinionsResolver())}),
        new MinionCard(player + "11", "pyroblin", 3, "battlecry: deal 3 damage", 2, 2, {battlecry: new DamageEffect(3, new AnyCharacterResolver())}),
        new MinionCard(player + "12", "sousChef braillard", 3, "Deal 1 to all", 2, 3, {battlecry: new DamageEffect(1, new AllMinionsResolver())}),
        new SpellCard(player + "13", "ping", 1, "deals 1 damage", new DamageEffect(1, new AnyCharacterResolver())),
        new SpellCard(player + "14", "Lecture de texte anciens", 3, "pioche 2 cartes", new DrawCardEffect(2)),
        new SpellCard(player + "16", "Arcane missiles", 1, "Deal 1 damage to 3 random enemies", new RandomMissileEffect(3, 1, new RandomEnemyResolver()))
    ]);

    const deck2 = new Deck ([
        new MinionCard(player + "20", "Jeffe", 3, "passive: when minion is damaged, + 1 atck, active: deal 1 damage to all minions", 3, 3, { battlecry: new DamageEffect(1, new AllMinionsResolver()) }, "jeffe"),
        new MinionCard(player + "18", "Flagbearer", 3, "whenever this attacks, buff its neighbors by 1/1", 3, 3, { onAttack: new BuffEffect(1, 1, new NeighboringMinionsResolver()) }),
        new MinionCard(player + "17", "lantern", 2, "at the start of your turn, draw 1 card", 0, 4, { startOfTurnEffect: new DrawCardEffect(1) }),
        new MinionCard(player + "0", "Ragnaros", 3, "at the end of your turn deal 4 damage to a random enemy", 2, 2, { endOfTurnEffect: new RandomMissileEffect(1, 4, new RandomEnemyResolver()) }),
        new MinionCard(player + "1", "DrawingWisp",  0, "battlecry: draw 1.",     1, 1, { battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "21", "Commis de la souffrance",   2, "pioche une carte quand il prend des degats", 1, 4, { onDamage: new DrawCardEffect(1) }),
        new MinionCard(player + "2", "Commis de la souffrance",   2, "pioche une carte quand il prend des degats", 1, 4, { onDamage: new DrawCardEffect(1) }),
        new MinionCard(player + "3", "TauntMurloc", 1, "Taunt", 2, 2, {taunt: true}),
        new MinionCard(player + "5", "gros Thon poli", 3, "heal 2hp", 4, 5, {taunt: true, battlecry: new HealEffect(2, new AnyCharacterResolver())}),
        new MinionCard(player + "6", "Argus", 2, "buff neighbors +1/+1 taunt", 2, 2,
            {battlecry: new CombinedEffect([new BuffEffect(1, 1, new NeighboringMinionsResolver()), new AddEffectfEffect(true, "taunt", new NeighboringMinionsResolver())])}),
        new MinionCard(player + "7", "Mother Spider", 2, "deathrattle: summon 2 1/1 spider baby's", 1, 1,
            {deathrattle: new SummonMinionEffect( [new MinionCard(player + "7.1", "baby spider", 0, "small and spidery", 1, 1), new MinionCard(player + "7.2", "baby spider", 0, "small and spidery", 1, 1)], 2)}),
        new MinionCard(player + "10", "GoblinFeeder", 3, "gives all friendly minions +1/+1", 2, 2, {battlecry: new BuffEffect(1, 1, new OtherAlliedMinionsResolver())}),
        new MinionCard(player + "11", "pyroblin", 3, "battlecry: deal 3 damage", 2, 2, {battlecry: new DamageEffect(3, new AnyCharacterResolver())}),
        new MinionCard(player + "12", "sousChef braillard", 3, "Deal 1 to all", 2, 3, {battlecry: new DamageEffect(1, new AllMinionsResolver())}),
        new SpellCard(player + "13", "ping", 1, "deals 1 damage", new DamageEffect(1, new AnyCharacterResolver())),
        new SpellCard(player + "14", "Lecture de texte anciens", 3, "pioche 2 cartes", new DrawCardEffect(2)),
        new SpellCard(player + "16", "Arcane missiles", 1, "Deal 1 damage to 3 random enemies", new RandomMissileEffect(3, 1, new RandomEnemyResolver()))
    ]);

    const deck3 = new Deck ([
        new MinionCard(player + "20", "Freddy", 3, "passive: when 4 minions die, summon a 1/1, active: trigger all friendly deathrattles", 3, 3, { battlecry: new triggerDeathrattleEffect(new AlliedMinionsResolver()) }, "freddy"),
        new MinionCard(player + "18", "Flagbearer", 3, "whenever this attacks, buff its neighbors by 1/1", 3, 3, { onAttack: new BuffEffect(1, 1, new NeighboringMinionsResolver()) }),
        new MinionCard(player + "17", "lantern", 2, "at the start of your turn, draw 1 card", 0, 4, { startOfTurnEffect: new DrawCardEffect(1) }),
        new MinionCard(player + "0", "Ragnaros", 3, "at the end of your turn deal 4 damage to a random enemy", 2, 2, { endOfTurnEffect: new RandomMissileEffect(1, 4, new RandomEnemyResolver()) }),
        new MinionCard(player + "1", "DrawingWisp",  0, "battlecry: draw 1.",     1, 1, { battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "2", "Rushy River Croc",   2, "Snappy.", 2, 3, {rush: true, taunt: true}),
        new MinionCard(player + "3", "TauntMurloc", 1, "Taunt", 2, 2, {taunt: true}),
        new MinionCard(player + "5", "gros Thon poli", 3, "heal 2hp", 4, 5, {taunt: true, battlecry: new HealEffect(2, new AnyCharacterResolver())}),
        new MinionCard(player + "6", "Argus", 2, "buff neighbors +1/+1 taunt", 2, 2,
            {battlecry: new CombinedEffect([new BuffEffect(1, 1, new NeighboringMinionsResolver()), new AddEffectfEffect(true, "taunt", new NeighboringMinionsResolver())])}),
        new MinionCard(player + "7", "Mother Spider", 2, "deathrattle: summon 2 1/1 spider baby's", 1, 1,
            {deathrattle: new SummonMinionEffect( [new MinionCard(player + "7.1", "baby spider", 0, "small and spidery", 1, 1), new MinionCard(player + "7.2", "baby spider", 0, "small and spidery", 1, 1)], 2)}),
        new MinionCard(player + "10", "GoblinFeeder", 3, "gives all friendly minions +1/+1", 2, 2, {battlecry: new BuffEffect(1, 1, new OtherAlliedMinionsResolver())}),
        new MinionCard(player + "11", "pyroblin", 3, "battlecry: deal 3 damage", 2, 2, {battlecry: new DamageEffect(3, new AnyCharacterResolver())}),
        new MinionCard(player + "12", "sousChef braillard", 3, "Deal 1 to all", 2, 3, {battlecry: new DamageEffect(1, new AllMinionsResolver())}),
        new SpellCard(player + "13", "ping", 1, "deals 1 damage", new DamageEffect(1, new AnyCharacterResolver())),
        new SpellCard(player + "14", "Lecture de texte anciens", 3, "pioche 2 cartes", new DrawCardEffect(2)),
        new SpellCard(player + "16", "Arcane missiles", 1, "Deal 1 damage to 3 random enemies", new RandomMissileEffect(3, 1, new RandomEnemyResolver()))
    ]);

    const deck4 = new Deck ([
        new MinionCard(player + "archi", "ARCHIMEDE", 7, "", 7, 7, { archi: true, battlecry: new archiDamageEffect(new EnemyHeroResolver()) }, "archimede"),
        new MinionCard(player + "0", "archi sbire 1", 1, "", 1, 1, { archi: true, battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "1", "archi sbire 2", 1, "", 1, 1, { archi: true, battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "40", "archi sbire 3", 1, "", 1, 1, { archi: true, battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "41", "archi sbire 5", 1, "", 1, 1, { archi: true, battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "42", "archi sbire 4", 1, "", 1, 1, { archi: true, battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "43", "archi sbire 6", 1, "", 1, 1, { archi: true, battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "44", "archi sbire 7", 1, "", 1, 1, { archi: true, battlecry: new DrawCardEffect(1) }),
        new MinionCard(player + "2", "Rushy River Croc",   2, "Snappy.", 2, 3, {rush: true, taunt: true}),
        new MinionCard(player + "3", "TauntMurloc", 1, "Taunt", 2, 2, {taunt: true}),
        new MinionCard(player + "5", "gros Thon poli", 3, "heal 2hp", 4, 5, {taunt: true, battlecry: new HealEffect(2, new AnyCharacterResolver())}),
        new MinionCard(player + "6", "Argus", 2, "buff neighbors +1/+1 taunt", 2, 2,
            {battlecry: new CombinedEffect([new BuffEffect(1, 1, new NeighboringMinionsResolver()), new AddEffectfEffect(true, "taunt", new NeighboringMinionsResolver())])}),
        new MinionCard(player + "7", "Mother Spider", 2, "deathrattle: summon 2 1/1 spider baby's", 1, 1,
            {deathrattle: new SummonMinionEffect( [new MinionCard(player + "7.1", "baby spider", 0, "small and spidery", 1, 1), new MinionCard(player + "7.2", "baby spider", 0, "small and spidery", 1, 1)], 2)}),
        new MinionCard(player + "10", "GoblinFeeder", 3, "gives all friendly minions +1/+1", 2, 2, {battlecry: new BuffEffect(1, 1, new OtherAlliedMinionsResolver())}),
        new MinionCard(player + "11", "pyroblin", 3, "battlecry: deal 3 damage", 2, 2, {battlecry: new DamageEffect(3, new AnyCharacterResolver())}),
        new MinionCard(player + "12", "sousChef braillard", 3, "Deal 1 to all", 2, 3, {battlecry: new DamageEffect(1, new AllMinionsResolver())}),
        new SpellCard(player + "13", "ping", 1, "deals 1 damage", new DamageEffect(1, new AnyCharacterResolver())),
        new SpellCard(player + "14", "Lecture de texte anciens", 3, "pioche 2 cartes", new DrawCardEffect(2)),
        new SpellCard(player + "16", "Arcane missiles", 1, "Deal 1 damage to 3 random enemies", new RandomMissileEffect(3, 1, new RandomEnemyResolver()))
    ]);

    if (deckNo == 0)
        return deck1;
    else if (deckNo == 1)
        return deck2
    else if (deckNo == 2)
        return deck3;
    else
        return deck4;
}
