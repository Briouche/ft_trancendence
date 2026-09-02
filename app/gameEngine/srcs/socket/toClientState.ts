import { Card, MinionCard, SpellCard } from "../card";
import { GameEngine } from "../gameEngine";
import { Effect } from "../effect";
import { ClientCard, ClientGameState, ClientHero, TargetOption, clientEffect } from "../shared/protocol";
import { Targetable } from "../target";
import { Player } from "../player";

function getOnPlayEffects(card: Card): Effect[]
{
    const effects: Effect[] = [];

    if (card instanceof SpellCard)
        effects.push(card.effect);

    if (card instanceof MinionCard && card.effects.battlecry)
        effects.push(card.effects.battlecry);

    return effects;
}

function requiresTarget(card: Card): boolean
{
    return getOnPlayEffects(card).some((effect: Effect) => 
        effect.resolver !== null && effect.resolver.requiresInput === true);
}

export function toClientCard(card: Card): ClientCard
{
    let effects: clientEffect = {};

    const clientCard: ClientCard = {
        id: card.id,
        name: card.name,
        assetKey: card.assetKey,
        rarity: card.rarity,
        cost: card.manaCost,
        description: card.description,
        requiresTarget : requiresTarget(card),
        effects: effects
    };

    if (card instanceof MinionCard)
    {
        clientCard.attack = card.attack;
        clientCard.health = card.currentHealth;
        clientCard.maxHealth = card.maxHealth;
        clientCard.baseAttack = card.baseAttack;
        clientCard.baseHealth = card.baseMaxHealth;
        clientCard.canAttack = card.canAttack;
        if (card.effects.taunt)
            clientCard.effects.taunt = true;
        if (card.effects.deathrattle)
            clientCard.effects.deathrattle = true;
        if (card.effects.startOfTurnEffect)
            clientCard.effects.startOfTurn = true;
        if (card.effects.endOfTurnEffect)
            clientCard.effects.endOfTurn = true;
        if (card.effects.onAttack)
            clientCard.effects.onAttack = true;
        if (card.effects.onDamage)
            clientCard.effects.onDamage = true;
        if (card.effects.battlecry)
            clientCard.effects.battlecry = true;
        if (card.effects.rush)
            clientCard.effects.rush = true;
        if (card.effects.archi)
            clientCard.effects.archi = true;
    }

    return clientCard;
}

function toClientHero(player: Player): ClientHero
{
    // Use the hero's own id and name so the client receives full hero identity emitted by the engine
    let data: ClientHero = { health: player.hero.currentHealth, name: player.hero.name, id: player.hero.id || player.id, maxHealth: player.hero.maxHealth };
    if (player.legPassive == "archimede")
        data.archi = player.archimedeCount;
    else if (player.legPassive == "freddy")
        data.freddy = player.freddyCount;
    else if (player.legPassive == "roidesrats")
        data.roiDesRats = player.roiDesRatsCount;
    else if (player.legPassive == "gertrude")
        data.gertrude = player.gertrudeCount;
    return data;
}

export function toClientState(engine: GameEngine, playerIndex: 0 | 1): ClientGameState
{
    const opponentIndex: 0 | 1 = playerIndex === 0 ? 1 : 0;

    return {
        yourTurn: engine.currentTurn === playerIndex,
        playerHero: toClientHero(engine.players[playerIndex]),
        opponentHero: toClientHero(engine.players[opponentIndex]),
        playerHand: engine.players[playerIndex].hand.getCards().map(toClientCard),
        opponentHandCount: engine.players[opponentIndex].hand.size(),
        playerBoard: engine.board.getMinions(playerIndex).map(toClientCard),
        opponentBoard: engine.board.getMinions(opponentIndex).map(toClientCard),
        mana: engine.players[playerIndex].currentMana,
        maxMana: engine.players[playerIndex].maxMana,
        playerDeck: engine.players[playerIndex].deck.size(),
        opponentDeck: engine.players[opponentIndex].deck.size()
    };
}
