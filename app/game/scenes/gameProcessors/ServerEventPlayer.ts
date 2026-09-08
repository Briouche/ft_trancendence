import Phaser from "phaser";
import { Board } from "../../objects/board/Board";
import { GameEvent } from "../../shared/protocol";
import { Card, withStartingStats } from "@/game/objects/card/Card";
import { showCardPreview } from "@/game/objects/card/CardPreview";
import { attackAnimation, battlecryAnimation, damageAnimation, healAnimation, buffAnimation, deathAnimation, deathrattleAnimation, passiveEffectAnimation, turnBannerAnimation, summonAnimation } from "../../animations";
import { MatchHistory } from "../../objects/history/MatchHistory";

//handles the "GameEvent" signal
// mostly runs the animations
export class ServerEventPlayer
{
    constructor(private scene: Phaser.Scene, private board: Board, private getPlayerIndex: () => 0 | 1 | null, private deferUntilCardExists: (cardId: string, run: (card: Card) => void) => void, private history: MatchHistory)
    {}

    async play(event: GameEvent): Promise<void>
    {
        switch (event.type)
        {
            case "attack": return this.playAttack(event);
            case "damage": return this.playDamage(event);
            case "heal": return this.playHeal(event);
            case "buff": return this.playBuff(event);
            case "cardPlayed": return this.playCardPlayed(event);
            case "summon": return this.playSummon(event);
            case "minionDied": return this.playMinionDied(event);
            case "turnEnded": return this.playTurnEnded(event);
            case "effect": return this.playEffectTriggered(event);
        }
    }

    private async playAttack(event: Extract<GameEvent, { type: "attack" }>): Promise<void>
    {
        const attackerCard = this.board.findCardById(event.attackerId);
        const target = this.board.getTargetById(event.targetId);
        const zone = target?.getZone();

        if (!attackerCard || !zone)
            return;

        const resolved = target?.resolve();
        const targetName = resolved?.kind === "hero" ? resolved.hero.heroData.name : resolved?.kind === "minion" ? resolved.card.cardData.name : "?";
        const attackerLabel = event.playerIndex === this.getPlayerIndex() ? "You" : "Opponent";
        this.history.beginAttack(attackerLabel, attackerCard.cardData.name, targetName);

        await attackAnimation(this.scene, attackerCard, zone.x, zone.y);
    }

    private async playDamage(event: Extract<GameEvent, { type: "damage" }>): Promise<void>
    {
        const resolved = this.board.getTargetById(event.targetId)?.resolve();
        if (!resolved)
            return;

        const targetObject = resolved.kind === "hero" ? resolved.hero : resolved.card;

        await damageAnimation(this.scene, targetObject, event.amount);
        if (resolved.kind === "hero")
            resolved.hero.setHealth(resolved.hero.heroData.health - event.amount);
        else if (resolved.kind === "minion")
            resolved.card.updateStats(resolved.card.cardData.health as number - event.amount, resolved.card.cardData.attack as number);
    }

    private async playHeal(event: Extract<GameEvent, { type: "heal" }>): Promise<void>
    {
        const resolved = this.board.getTargetById(event.targetId)?.resolve();
        if (!resolved)
            return;

        const targetObject = resolved.kind === "hero" ? resolved.hero : resolved.card;
        const targetName = resolved.kind === "hero" ? resolved.hero.heroData.name : resolved.card.cardData.name;
        this.history.addDetail(`Healed ${targetName} for ${event.amount}`);

        await healAnimation(this.scene, targetObject, event.amount);
        if (resolved.kind === "hero")
            resolved.hero.setHealth(resolved.hero.heroData.health + event.amount);
        else if (resolved.kind === "minion")
            resolved.card.updateStats(resolved.card.cardData.health as number + event.amount, resolved.card.cardData.attack as number);
    }

    private async playBuff(event: Extract<GameEvent, { type: "buff" }>): Promise<void>
    {
        const resolved = this.board.getTargetById(event.targetId)?.resolve();
        if (!resolved)
            return;

        if (resolved.kind === "hero")
        {
            this.history.addDetail(`${resolved.hero.heroData.name} gained +${event.healthDelta} health`);
            await buffAnimation(this.scene, resolved.hero, 0, event.healthDelta);
            resolved.hero.setHealth(resolved.hero.heroData.health + event.healthDelta);
        }
        else if (resolved.kind === "minion")
        {
            this.history.addDetail(`${resolved.card.cardData.name} gained +${event.attackDelta}/+${event.healthDelta}`);
            await buffAnimation(this.scene, resolved.card, event.attackDelta, event.healthDelta);
            resolved.card.updateStats(
                (resolved.card.cardData.health as number) + event.healthDelta,
                (resolved.card.cardData.attack as number) + event.attackDelta
            );
        }
    }

    private async playMinionDied(event: Extract<GameEvent, { type: "minionDied" }>): Promise<void>
    {
        const card = this.board.findCardById(event.minionId);
        if (!card)
            return;
        this.history.addDetail(`${card.cardData.name} died`);
        await deathAnimation(this.scene, card);
    }

    private async playCardPlayed(event: Extract<GameEvent, { type: "cardPlayed" }>): Promise<void>
    {
        const label = event.playerIndex === this.getPlayerIndex() ? "You" : "Opponent";
        this.history.beginCardPlayed(label, event.card.name, event.card.assetKey, event.card.id);

        if (event.targetId)
        {
            const resolved = this.board.getTargetById(event.targetId)?.resolve();
            const targetName = resolved?.kind === "hero" ? resolved.hero.heroData.name : resolved?.kind === "minion" ? resolved.card.cardData.name : undefined;
            if (targetName)
                this.history.addDetail(`→ Targeted ${targetName}`);
        }

        showCardPreview(this.scene, event.card, 2000);
    }

    private async playSummon(event: Extract<GameEvent, { type: "summon" }>): Promise<void>
    {
        if (!this.history.isRedundantSummon(event.card.id))
            this.history.addDetail(`→ Summoned ${event.card.name}`);

        const side: 0 | 1 = event.playerIndex === this.getPlayerIndex() ? 0 : 1;
        const alreadyOnBoard = this.board.findCardById(event.card.id) !== undefined;
        const card = this.board.materializeMinion(side, withStartingStats(event.card), event.boardIndex);
        if (!alreadyOnBoard)
            await summonAnimation(this.scene, card);
    }

    private async playTurnEnded(event: Extract<GameEvent, { type: "turnEnded" }>): Promise<void>
    {
        const label = event.nextPlayerIndex === this.getPlayerIndex() ? "Your Turn" : "Opponent's Turn";
        this.history.beginTurnEnded(label);
        await turnBannerAnimation(this.scene, label);
    }

    private async playEffectTriggered(event: Extract<GameEvent, { type: "effect" }>): Promise<void>
    {
        const existing = this.board.findCardById(event.minionId);

        if (existing)
        {
            await this.runEffectAnimation(event.trigger, existing);
            return;
        }
        this.deferUntilCardExists(event.minionId, (card) =>
        {
            void this.runEffectAnimation(event.trigger, card);
        });
    }

    private async runEffectAnimation(trigger: "passive" | "deathrattle" | "battlecry", card: Card): Promise<void>
    {
        this.history.addDetail(`${card.cardData.name}'s ${trigger} triggered`);

        if (trigger === "passive")
            await passiveEffectAnimation(this.scene, card);
        else if (trigger === "deathrattle")
            await deathrattleAnimation(this.scene, card);
        else if (trigger === "battlecry")
            await battlecryAnimation(this.scene, card);
    }
}
