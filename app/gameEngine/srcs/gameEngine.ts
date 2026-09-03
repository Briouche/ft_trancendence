import { MinionCard, SpellCard } from "./card";
import { Board } from "./board";
import { Player } from "./player";
import { GameContext } from "./effect";
import { Targetable } from "./target";
import { Effect } from "./effect";
import { Hero } from "./hero";
import { freddyPassive, jeffePassive, timmyPassive } from "./legendary";

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
    | { type: "playCard"; cardIndex: number }
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

    startGame(): void
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
        this.startTurn();
    }

    startTurn(): ActionResult
    {
        const player: Player = this.activePlayer();
        player.gainMana();
        player.drawCard();

        const minions: MinionCard[] = this.board.getMinions(this.currentTurn);
        for (const minion of minions)
        {
            minion.canAttack = true;
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

    // fires one minion's end-of-turn effect, whether from the natural end-of-turn sweep or a
    // card re-triggering it (e.g. Investment Goblin) — roidesrats' passive counts every such
    // trigger and repeats every 3rd one, so it must live here rather than in endTurn().
    triggerMinionEndOfTurnEffect(playerIndex: 0 | 1, minion: MinionCard): void
    {
        if (minion.effects.endOfTurnEffect === undefined)
            return;

        const player: Player = this.players[playerIndex];
        const context: GameContext = { engine: this, owner: player, source: minion, target: undefined };

        this.recordAnimationChain({ kind: "effect", sourceId: minion.id, trigger: "passive" });
        minion.effects.endOfTurnEffect.execute(context);
        this.processDeaths();

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

    endTurn(): ActionResult
    {
        this.animationChain = [];

        this.triggerEndOfTurnEffects(this.currentTurn);

        this.currentTurn = this.currentTurn === 0 ? 1 : 0;
        this.startTurn(); // effects and events caused by start turn are ignored right now
        return { succes: true, animationEvents: this.animationChain };
    }

    playCard(cardIndex: number, targets: Map<Effect, Targetable | null>, boardIndex?: number): ActionResult
    {
        this.animationChain = [];
        const player = this.activePlayer();
        const card = player.hand.getCards()[cardIndex];

        if (!card || card.manaCost > player.currentMana)
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
            else if (card.effects.rush)
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
                    //console.log("minion died: " + minion.name + ": freddycount = " + this.players[opponentIndex].freddyCount);
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
            if (hand[i].manaCost <= player.currentMana)
                actions.push({ type: "playCard", cardIndex: i });
        }

        const attackers = this.board.getMinions(this.currentTurn);
        const targets    = this.board.getMinions(opponentIndex);
        for (let i = 0; i < attackers.length; i++)
        {
            if (!attackers[i].canAttack)
                continue;
            actions.push({ type: "attack", attackerIndex: i, targetIndex: -1 });
            for (let t = 0; t < targets.length; t++)
                actions.push({ type: "attack", attackerIndex: i, targetIndex: t });
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

