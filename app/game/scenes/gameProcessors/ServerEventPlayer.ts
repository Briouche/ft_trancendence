import Phaser from "phaser";
import { Board } from "../../objects/board/Board";
import { GameEvent } from "../../shared/protocol";
import { attackAnimation, damageAnimation, deathAnimation, turnBannerAnimation } from "../../animations";

//handles the "GameEvent" signal
// mostly runs the animations
export class ServerEventPlayer
{
    constructor(private scene: Phaser.Scene, private board: Board, private getPlayerIndex: () => 0 | 1 | null, private onCardPlayed: (cardId: string) => void)
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
        this.onCardPlayed(event.cardId);
    }

    private async playTurnEnded(event: Extract<GameEvent, { type: "turnEnded" }>): Promise<void>
    {
        const label = event.nextPlayerIndex === this.getPlayerIndex() ? "Your Turn" : "Opponent's Turn";
        await turnBannerAnimation(this.scene, label);
    }
}
