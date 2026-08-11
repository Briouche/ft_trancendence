import { Card, MinionCard, SpellCard } from "../card";
import { GameEngine } from "../gameEngine";
import { Effect } from "../effect";
import { ClientCard, ClientGameState, TargetOption } from "../shared/protocol";
import { Targetable } from "../target";

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

function toClientCard(card: Card): ClientCard
{
    const clientCard: ClientCard = {
        id: card.id,
        name: card.name,
        cost: card.manaCost,
        description: card.description,
        requiresTarget : requiresTarget(card)
    };

    if (card instanceof MinionCard)
    {
        clientCard.attack = card.attack;
        clientCard.health = card.currentHealth;
        clientCard.canAttack = card.canAttack;
    }

    return clientCard;
}

export function toClientState(engine: GameEngine, playerIndex: 0 | 1): ClientGameState
{
    const opponentIndex: 0 | 1 = playerIndex === 0 ? 1 : 0;

    return {
        yourTurn: engine.currentTurn === playerIndex,
        playerHero: engine.players[playerIndex].hero.currentHealth,
        opponentHero: engine.players[opponentIndex].hero.currentHealth,
        playerHand: engine.players[playerIndex].hand.getCards().map(toClientCard),
        opponentHandCount: engine.players[opponentIndex].hand.size(),
        playerBoard: engine.board.getMinions(playerIndex).map(toClientCard),
        opponentBoard: engine.board.getMinions(opponentIndex).map(toClientCard),
    };
}
