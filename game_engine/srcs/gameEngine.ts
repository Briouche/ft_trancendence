import { Card, MinionCard, SpellCard } from "./card";
import { Board, MAX_BOARD_SIZE } from "./board";
import { Player } from "./player";
import { GameContext, Effect } from "./effect";
import { Targetable, EnemyCharacterResolver } from "./target";
import { Hero } from "./hero";
import { freddyPassive, jeffePassive, timmyPassive } from "./legendary";

// What happened during an action, in order, for the client to animate.
export type AnimationEvent =
    | { kind: "summon"; minion: MinionCard; playerIndex: 0 | 1 }
    | { kind: "damage"; target: Targetable; amount: number }
    | { kind: "heal"; target: Targetable; amount: number }
    | { kind: "buff"; target: Targetable; attackDelta: number; healthDelta: number }
    | { kind: "effect"; sourceId: string; trigger: "passive" | "battlecry" | "deathrattle" }
    | { kind: "death"; minionId: string; playerIndex: 0 | 1 };

export interface ActionResult
{
    success: boolean;
    animationEvents: AnimationEvent[];
}

// A legal move for the active player (used by the AI search).
export type Action =
    | { type: "playCard"; cardIndex: number; targetIndex?: number }
    | { type: "attack"; attackerIndex: number; targetIndex: number }
    | { type: "endTurn" };

/**
 * Authoritative state and rules of one match. GameSession drives the real instance;
 * ai/tree.ts clones it to simulate moves.
 */
export class GameEngine
{
    public readonly players: [Player, Player];
    public board: Board;
    public currentTurn: 0 | 1;
    private animationChain: AnimationEvent[] = [];

    constructor(players: [Player, Player])
    {
        this.players = players;
        this.board = new Board();
        this.currentTurn = 0;
    }

    // 3 cards each, one extra for the second player.
    startGame(): ActionResult
    {
        for (let i = 0; i < 2; i++)
        {
            this.players[i].checkDeckForLeg();
            if (this.players[i].legPassive === "timmy")
                timmyPassive(this.players[i]);

            this.players[i].deck.shuffle();
            for (let j = 0; j < 3; j++)
                this.players[i].drawCard();
            if (i === 1)
                this.players[i].drawCard();
        }
        return this.startTurn();
    }

    startTurn(): ActionResult
    {
        this.animationChain = [];

        const player: Player = this.activePlayer();
        player.gainMana();
        player.drawCard();

        const minions: MinionCard[] = this.board.getMinions(this.currentTurn);
        for (const minion of minions)
        {
            minion.canAttack = !minion.effects.cannotAttack;
            if (minion.effects.rush && minion.effects.rush == true)
                minion.effects.rush = false;
            if (minion.effects.startOfTurnEffect !== undefined)
            {
                const context: GameContext = { engine: this, owner: this.activePlayer(), source: minion, target: undefined };
                this.recordAnimationChain({ kind: "effect", sourceId: minion.id, trigger: "passive" });
                minion.effects.startOfTurnEffect.execute(context);
                this.processDeaths();
            }
        }
        return { success: true, animationEvents: this.animationChain };
    }

    triggerEndOfTurnEffects(playerIndex: 0 | 1): void
    {
        const minions: MinionCard[] = this.board.getMinions(playerIndex);
        for (const minion of minions)
            this.triggerMinionEndOfTurnEffect(playerIndex, minion);
    }

    triggerMinionEndOfTurnEffect(playerIndex: 0 | 1, minion: MinionCard): void
    {
        if (minion.effects.endOfTurnEffect === undefined)
            return;

        const player: Player = this.players[playerIndex];
        const context: GameContext = { engine: this, owner: player, source: minion, target: undefined };

        this.recordAnimationChain({ kind: "effect", sourceId: minion.id, trigger: "passive" });
        minion.effects.endOfTurnEffect.execute(context);
        this.processDeaths();

        // Roi des rats: every 3rd end-of-turn effect fires twice.
        if (player.legPassive === "roidesrats")
        {
            player.roiDesRatsCount++;
            if (player.roiDesRatsCount % 3 === 0)
            {
                this.recordAnimationChain({ kind: "effect", sourceId: minion.id, trigger: "passive" });
                minion.effects.endOfTurnEffect.execute(context);
                this.processDeaths();
            }
        }
    }

    endTurn(): { endOfTurn: ActionResult; startOfTurn: ActionResult }
    {
        this.animationChain = [];
        this.triggerEndOfTurnEffects(this.currentTurn);
        const endOfTurn: ActionResult = { success: true, animationEvents: this.animationChain };

        this.currentTurn = this.currentTurn === 0 ? 1 : 0;
        const startOfTurn: ActionResult = this.startTurn();

        return { endOfTurn, startOfTurn };
    }

    playCard(cardIndex: number, targets: Map<Effect, Targetable | null>, boardIndex?: number): ActionResult
    {
        this.animationChain = [];
        const player = this.activePlayer();
        const card = player.hand.getCards()[cardIndex];

        if (!card || card.manaCost > player.currentMana)
            return { success: false, animationEvents: [] };

        if (card instanceof MinionCard && this.board.getMinions(this.currentTurn).length >= MAX_BOARD_SIZE)
            return { success: false, animationEvents: [] };

        player.hand.play(cardIndex);
        player.spendMana(card.manaCost);

        if (card instanceof MinionCard)
        {
            if (boardIndex !== undefined)
                this.board.playMinion(this.currentTurn, card, boardIndex);
            else
                this.board.playMinion(this.currentTurn, card);
            this.recordAnimationChain({ kind: "summon", minion: card, playerIndex: this.currentTurn });
            if (card.effects.archi)
                this.players[this.currentTurn].archimedeCount++;
            if (card.effects.battlecry)
            {
                const context: GameContext = {engine: this, owner: this.activePlayer(), source: card, target: targets.get(card.effects.battlecry) ?? undefined};
                this.recordAnimationChain({ kind: "effect", sourceId: card.id, trigger: "battlecry" });
                card.effects.battlecry.execute(context);
            }
            if (card.effects.rush && !card.effects.cannotAttack)
                card.canAttack = true;
        }
        else if (card instanceof SpellCard)
        {
            const spellpower = this.board.getMinions(this.currentTurn)
                .reduce((sum, m) => sum + (m.effects.spellpower ?? 0), 0);
            const context: GameContext = {engine: this, owner: this.players[this.currentTurn], source: card, target: targets.get(card.effect) ?? undefined, bonusDamage: spellpower};
            card.effect.execute(context);

            // Gertrude: every 4th spell returns to hand.
            if (player.legPassive === "gertrude")
            {
                player.gertrudeCount++;
                if (player.gertrudeCount % 4 === 0)
                    player.hand.add(card);
            }
        }
        this.processDeaths();
        return { success: true, animationEvents: this.animationChain };
    }

    attackWithMinion(attackerIndex: number, target: Targetable): ActionResult
    {
        this.animationChain = [];
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;
        const attacker: MinionCard = this.board.getMinions(this.currentTurn)[attackerIndex];

        if (!attacker || !attacker.canAttack)
            return { success: false, animationEvents: [] };

        attacker.canAttack = false;

        if (attacker.effects.onAttack && (!attacker.effects.onAttack.resolver || !attacker.effects.onAttack.resolver.requiresInput))
        {
            const context: GameContext = { engine: this, owner: this.players[this.currentTurn], source: attacker, target: target };
            this.recordAnimationChain({ kind: "effect", sourceId: attacker.id, trigger: "passive" });
            attacker.effects.onAttack.execute(context);
        }
        if (target instanceof Hero)
        {
            this.players[opponentIndex].hero.takeDamage(attacker.attack);
            this.recordDamage(this.players[opponentIndex].hero, attacker.attack, this.players[opponentIndex]);
        }
        else if (target instanceof MinionCard)
        {
            const targetAttack: number = target.attack;
            attacker.takeDamage(target.attack);
            target.takeDamage(attacker.attack);
            this.recordDamage(target, attacker.attack, this.players[opponentIndex]);
            this.recordDamage(attacker, targetAttack, this.players[this.currentTurn]);
        }

        this.processDeaths();
        return { success: true, animationEvents: this.animationChain };
    }

    activePlayer(): Player
    {
        return this.players[this.currentTurn];
    }

    findOwnerById(targetId: string): Player | undefined
    {
        for (const player of this.players)
        {
            if (player.hero.id === targetId
                || player.index === 0 && this.board.getMinions(0).some(minion => minion.id === targetId)
                || player.index === 1 && this.board.getMinions(1).some(minion => minion.id === targetId))
                return player;
        }
        return undefined;
    }

    // Repeats until no minion is dead, since deathrattles can kill more minions. Dead minions
    // leave the board before their deathrattle runs so summons see the free slots.
    processDeaths(): void
    {
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;

        while (true)
        {
            const deadCurrent: MinionCard[] = this.board.collectDead(this.currentTurn);
            const deadOpponent: MinionCard[] = this.board.collectDead(opponentIndex);

            if (deadCurrent.length === 0 && deadOpponent.length === 0)
                break;

            this.board.clearDead(this.currentTurn);
            this.board.clearDead(opponentIndex);

            this.resolveDeaths(deadCurrent, this.currentTurn);
            this.resolveDeaths(deadOpponent, opponentIndex);
        }
    }

    // Deathrattles, then Freddy's passive (a skeleton every 4th friendly death).
    private resolveDeaths(dead: MinionCard[], playerIndex: 0 | 1): void
    {
        const player: Player = this.players[playerIndex];

        for (const minion of dead)
        {
            if (minion.effects.deathrattle)
            {
                const context: GameContext = { engine: this, owner: player, source: minion };
                this.recordAnimationChain({ kind: "effect", sourceId: minion.id, trigger: "deathrattle" });
                this.recordAnimationChain({ kind: "death", minionId: minion.id, playerIndex });
                minion.effects.deathrattle.execute(context);
            }
            else
                this.recordAnimationChain({ kind: "death", minionId: minion.id, playerIndex });

            if (player.legPassive === "freddy")
            {
                player.freddyCount++;
                if (player.freddyCount % 4 === 0)
                {
                    const context: GameContext = { engine: this, owner: player, source: minion };
                    freddyPassive(context, player.freddyCount / 4);
                }
            }
        }
    }

    recordAnimationChain(event: AnimationEvent): void
    {
        this.animationChain.push(event);
    }

    // Also fires the target's onDamage hook and Jeffe's passive.
    recordDamage(target: Targetable, amount: number, owner: Player | undefined)
    {
        this.recordAnimationChain({ kind: "damage", target, amount });

        if (target instanceof MinionCard && target.effects.onDamage && owner !== undefined)
        {
            const context: GameContext = { engine: this, owner: owner, source: target };
            this.recordAnimationChain({ kind: "effect", sourceId: target.id, trigger: "passive" });
            target.effects.onDamage.execute(context);
        }
        if (owner !== undefined && owner.legPassive === "jeffe" && target instanceof MinionCard)
            jeffePassive(target);
    }

    recordHeal(target: Targetable, amount: number): void
    {
        this.recordAnimationChain({ kind: "heal", target, amount });
    }

    recordBuff(target: Targetable, attackDelta: number, healthDelta: number): void
    {
        this.recordAnimationChain({ kind: "buff", target, attackDelta, healthDelta });
    }

    clone(): GameEngine
    {
        const copy = new GameEngine([this.players[0].clone(), this.players[1].clone()]);
        copy.board       = this.board.clone();
        copy.currentTurn = this.currentTurn;
        return copy;
    }

    getOnPlayEffect(card: Card): Effect | null
    {
        if (card instanceof SpellCard)
            return card.effect;
        if (card instanceof MinionCard && card.effects.battlecry)
            return card.effects.battlecry;
        return null;
    }

    // Legal targets of a card's on-play effect; empty when it needs no target.
    getOnPlayTargets(card: Card): Targetable[]
    {
        const effect = this.getOnPlayEffect(card);

        if (!effect || !effect.resolver || !effect.resolver.requiresInput)
            return [];

        const context: GameContext = { engine: this, owner: this.activePlayer(), source: card };
        return effect.resolver.resolve(context);
    }

    // Mirrors the checks of playCard() / attackWithMinion().
    getLegalActions(): Action[]
    {
        const actions: Action[] = [];
        const player: Player = this.activePlayer();
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;

        const hand = player.hand.getCards();
        for (let i = 0; i < hand.length; i++)
        {
            const card = hand[i];

            if (card.manaCost > player.currentMana)
                continue;
            if (card instanceof MinionCard && this.board.getMinions(this.currentTurn).length >= MAX_BOARD_SIZE)
                continue;

            const effect = this.getOnPlayEffect(card);

            if (effect && effect.resolver && effect.resolver.requiresInput)
            {
                const targets = this.getOnPlayTargets(card);

                if (targets.length === 0)
                {
                    // A battlecry without a legal target no-ops; a spell without one isn't playable.
                    if (!(card instanceof SpellCard))
                        actions.push({ type: "playCard", cardIndex: i });
                }
                else
                {
                    for (let t = 0; t < targets.length; t++)
                        actions.push({ type: "playCard", cardIndex: i, targetIndex: t });
                }
            }
            else
                actions.push({ type: "playCard", cardIndex: i });
        }

        const attackers = this.board.getMinions(this.currentTurn);
        const opponentMinions = this.board.getMinions(opponentIndex);
        const attackResolver = new EnemyCharacterResolver();

        for (let i = 0; i < attackers.length; i++)
        {
            const attacker = attackers[i];

            if (!attacker.canAttack)
                continue;

            const validTargets = attackResolver.resolve({ engine: this, owner: player, source: attacker });

            for (const target of validTargets)
            {
                const targetIndex = target instanceof MinionCard ? opponentMinions.indexOf(target) : -1;
                actions.push({ type: "attack", attackerIndex: i, targetIndex });
            }
        }

        actions.push({ type: "endTurn" });
        return actions;
    }

    isTerminal(): boolean
    {
        return !this.players[0].hero.isAlive() || !this.players[1].hero.isAlive();
    }

    getWinner(): 0 | 1 | null
    {
        const p0Alive = this.players[0].hero.isAlive();
        const p1Alive = this.players[1].hero.isAlive();

        if (!p0Alive && !p1Alive)
            return null;
        if (!p0Alive)
            return 1;
        if (!p1Alive)
            return 0;
        return null;
    }
}
