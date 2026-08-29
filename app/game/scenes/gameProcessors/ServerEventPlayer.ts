import Phaser from "phaser";
import { Board } from "../../objects/board/Board";
import { GameEvent } from "../../shared/protocol";
import { Card } from "@/game/objects/Card";
import { showCardPreview } from "@/game/objects/CardPreview";
import { attackAnimation, battlecryAnimation, damageAnimation, deathAnimation, deathrattleAnimation, passiveEffectAnimation, turnBannerAnimation, summonAnimation } from "../../animations";

//handles the "GameEvent" signal
// mostly runs the animations
export class ServerEventPlayer
{
    constructor(private scene: Phaser.Scene, private board: Board, private getPlayerIndex: () => 0 | 1 | null, private deferUntilCardExists: (cardId: string, run: (card: Card) => void) => void)
    {}

    async play(event: GameEvent): Promise<void>
    {
        switch (event.type)
        {
            case "attack": return this.playAttack(event);
            case "damage": return this.playDamage(event);
            case "cardPlayed": return this.playCardPlayed(event);
            case "minionDied": return this.playMinionDied(event);
            case "turnEnded": return this.playTurnEnded(event);
            case "effect": return this.playEffectTriggered(event);
        }
    }

    private async playAttack(event: Extract<GameEvent, { type: "attack" }>): Promise<void>
    {
        const attackerCard = this.board.findCardById(event.attackerId);
        const zone = this.board.getTargetById(event.targetId)?.getZone();

        if (!attackerCard || !zone)
            return;
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

    private async playMinionDied(event: Extract<GameEvent, { type: "minionDied" }>): Promise<void>
    {
        const card = this.board.findCardById(event.minionId);
        if (!card)
            return;
        await deathAnimation(this.scene, card);
    }

    private async playCardPlayed(event: Extract<GameEvent, { type: "cardPlayed" }>): Promise<void>
    {
        showCardPreview(this.scene, event.card, 2000);
        this.deferUntilCardExists(event.cardId, (card) => summonAnimation(this.scene, card));
    }

    private async playTurnEnded(event: Extract<GameEvent, { type: "turnEnded" }>): Promise<void>
    {
        const label = event.nextPlayerIndex === this.getPlayerIndex() ? "Your Turn" : "Opponent's Turn";
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
        if (trigger === "passive")
            await passiveEffectAnimation(this.scene, card);
        else if (trigger === "deathrattle")
            await deathrattleAnimation(this.scene, card);
        else if (trigger === "battlecry")
            await battlecryAnimation(this.scene, card);
    }
}
