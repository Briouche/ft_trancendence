import { Card, MinionCard, SpellCard } from "./card";
import { Board } from "./board";
import { Player } from "./player";
import { GameContext } from "./effect";
import { Targetable, EnemyCharacterResolver } from "./target";
import { Effect } from "./effect";
import { Hero } from "./hero";
import { freddyPassive, jeffePassive, timmyPassive } from "./legendary";

// GameEngine holds the authoritative state of one match — players, board, whose turn it is — plus
// every rule for mutating it (playing a card, attacking, ending a turn, resolving deaths). Two
// very different callers drive it: socket/gameSession.ts mutates the single real instance for a
// live match and streams its AnimationEvents to clients, while ai/tree.ts clones it on every
// simulated move so MCTS can explore hypothetical futures without ever touching the real game.
// Every mutating method returns an ActionResult carrying the AnimationEvents it produced, so
// callers don't have to diff state before/after to know what to animate.
export type AnimationEvent =
    | { kind: "summon"; minion: MinionCard; playerIndex: 0 | 1 }
    | { kind: "damage"; target: Targetable; amount: number }
    | { kind: "heal"; target: Targetable; amount: number }
    | { kind: "buff"; target: Targetable; attackDelta: number; healthDelta: number }
    | { kind: "effect"; sourceId: string; trigger: "passive" | "battlecry" | "deathrattle" }
    | { kind: "death"; minionId: string; playerIndex: 0 | 1 };

export interface ActionResult
{
    succes: boolean;
    animationEvents: AnimationEvent[];
}

export type Action =
    | { type: "playCard"; cardIndex: number; targetIndex?: number }
    | { type: "attack"; attackerIndex: number; targetIndex: number }
    | { type: "endTurn" };


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
                let context: GameContext = { engine: this, owner: this.activePlayer(), source: minion, target: undefined };
                this.recordAnimationChain({ kind: "effect", sourceId: minion.id, trigger: "passive" });
                minion.effects.startOfTurnEffect.execute(context);
                this.processDeaths();
            }
        }
        return { succes: true, animationEvents: this.animationChain };
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

        // roidesrats passive: every 3rd end-of-turn trigger this game, fire the effect a second time.
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
        const endOfTurn: ActionResult = { succes: true, animationEvents: this.animationChain };

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
            return { succes: false, animationEvents: [] };

        if (card instanceof MinionCard && this.board.getMinions(this.currentTurn).length >= 6)
            return { succes: false, animationEvents: [] };

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
                let context: GameContext = {engine: this, owner: this.activePlayer(), source: card, target: targets.get(card.effects.battlecry) ?? undefined};
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
            let context: GameContext = {engine: this, owner: this.players[this.currentTurn], source: card, target: targets.get(card.effect) ?? undefined, bonusDamage: spellpower};
            card.effect.execute(context);

            if (player.legPassive === "gertrude")
            {
                player.gertrudeCount++;
                if (player.gertrudeCount % 4 === 0)
                    player.hand.add(card);
            }
        }
        this.processDeaths();
        return { succes: true, animationEvents: this.animationChain };
    }

    attackWithMinion(attackerIndex: number, target: Targetable): ActionResult
    {
        this.animationChain = [];
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;
        const attacker: MinionCard = this.board.getMinions(this.currentTurn)[attackerIndex];

        if (!attacker || !attacker.canAttack)
            return { succes: false, animationEvents: [] };

        attacker.canAttack = false;

        if (attacker.effects.onAttack && (!attacker.effects.onAttack.resolver || !attacker.effects.onAttack.resolver.requiresInput))
        {
            let context: GameContext = { engine: this, owner: this.players[this.currentTurn], source: attacker, target: target };
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
        this.checkWinCondition();
        return { succes: true, animationEvents: this.animationChain };
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

    checkWinCondition(): boolean
    {
        for (const player of this.players)
        {
            if (!player.hero.isAlive())
            {
                return true;
            }        
        }
        return false;
    }

    processDeaths(): void
    {
        const opponentIndex: 0 | 1 = this.currentTurn === 0 ? 1 : 0;

        // Loops instead of a single pass: a deathrattle can kill further minions (AoE deathrattle,
        // destroyEffect chain, ...), so deaths are re-collected until none remain. Dead minions
        // are cleared from the board before their deathrattles run, so summon effects see
        // accurate free space (SummonMinionEffect checks board.getMinions().length < 6).
        while (true)
        {
            const deadCurrent: MinionCard[] = this.board.collectDead(this.currentTurn);
            const deadOpponent: MinionCard[] = this.board.collectDead(opponentIndex);

            if (deadCurrent.length === 0 && deadOpponent.length === 0)
                break;

            this.board.clearDead(this.currentTurn);
            this.board.clearDead(opponentIndex);

            for (const minion of deadCurrent)
            {
                if (minion.effects.deathrattle)
                {
                    const context: GameContext = { engine: this, owner: this.players[this.currentTurn], source: minion };
                    this.recordAnimationChain({ kind: "effect", sourceId: minion.id, trigger: "deathrattle" });
                    this.recordAnimationChain({ kind: "death", minionId: minion.id, playerIndex: this.currentTurn });
                    minion.effects.deathrattle.execute(context);
                }
                else
                    this.recordAnimationChain({ kind: "death", minionId: minion.id, playerIndex: this.currentTurn });
                if (this.players[this.currentTurn].legPassive === "freddy")
                {
                    this.players[this.currentTurn].freddyCount++;
                    if (this.players[this.currentTurn].freddyCount % 4 === 0)
                    {
                        const context: GameContext = { engine: this, owner: this.players[this.currentTurn], source: minion };
                        freddyPassive(context, this.players[this.currentTurn].freddyCount / 4);
                    }
                }
            }
            for (const minion of deadOpponent)
            {
                if (minion.effects.deathrattle)
                {
                    const ctx: GameContext = { engine: this, owner: this.players[opponentIndex], source: minion };
                    this.recordAnimationChain({ kind: "effect", sourceId: minion.id, trigger: "deathrattle" });
                    this.recordAnimationChain({ kind: "death", minionId: minion.id, playerIndex: opponentIndex });
                    minion.effects.deathrattle.execute(ctx);
                }
                else
                    this.recordAnimationChain({ kind: "death", minionId: minion.id, playerIndex: opponentIndex });
                if (this.players[opponentIndex].legPassive === "freddy")
                {
                    this.players[opponentIndex].freddyCount++;
                    if (this.players[opponentIndex].freddyCount % 4 === 0)
                    {
                        const context: GameContext = { engine: this, owner: this.players[opponentIndex], source: minion };
                        freddyPassive(context, this.players[opponentIndex].freddyCount / 4);
                    }
                }
            }
        }
    }

    recordAnimationChain(event: AnimationEvent): void
    {
        this.animationChain.push(event);
    }

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

    toString(): string
    {
        return this.players[0].toString() + "\n"
             + this.players[1].toString() + "\n"
             + "---\n"
             + this.board.toString();
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

    // Resolves the legal targets for a card's on-play effect against the current state.
    // Empty for cards with no on-play effect, or an effect that doesn't require a target.
    getOnPlayTargets(card: Card): Targetable[]
    {
        const effect = this.getOnPlayEffect(card);

        if (!effect || !effect.resolver || !effect.resolver.requiresInput)
            return [];

        const context: GameContext = { engine: this, owner: this.activePlayer(), source: card };
        return effect.resolver.resolve(context);
    }

    //getLegalActions() duplicates the mana/canAttack checks already inside playCard()/attackWithMinion().
    //If either of those changes, this needs to change with it — flag it now so it doesn't silently drift.

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
            if (card instanceof MinionCard && this.board.getMinions(this.currentTurn).length >= 6)
                continue;

            const effect = this.getOnPlayEffect(card);

            if (effect && effect.resolver && effect.resolver.requiresInput)
            {
                const targets = this.getOnPlayTargets(card);

                if (targets.length === 0)
                {
                    if (!(card instanceof SpellCard))
                        actions.push({ type: "playCard", cardIndex: i }); // battlecry with no legal target no-ops, same as human path
                    // spell with no legal target: not playable, matches gameSession's "no valid targets" rejection
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

