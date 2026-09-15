import Phaser from "phaser";

const ARROW_COLOR = 0xffa500;
const ARROW_WIDTH = 16;
const HEAD_LENGTH = 32;
const HEAD_ANGLE = Math.PI / 4;
const ARROW_DEPTH = 2000;
const CURVE_BIAS = 120;
const DOTTED_SEGMENTS = 20;

// Curved dashed arrow from a card to the pointer while choosing a target.
export class TargetArrow
{
    private graphic: Phaser.GameObjects.Graphics;
    private startX: number;
    private startY: number;

    constructor(scene: Phaser.Scene, startX: number, startY: number)
    {
        this.startX = startX;
        this.startY = startY;
        this.graphic = scene.add.graphics();
        this.graphic.setDepth(ARROW_DEPTH);
        this.draw(startX, startY);
    }

    private draw(endX: number, endY: number)
    {
        this.graphic.clear();

        const controlX = (this.startX + endX) / 2;
        const controlY = (this.startY + endY) / 2 - CURVE_BIAS;

        for (let i = 0; i < DOTTED_SEGMENTS; i += 2)
        {
            const t0 = i / DOTTED_SEGMENTS;
            const t1 = (i + 1) / DOTTED_SEGMENTS;
            const p0 = this.getQuadraticPoint(this.startX, this.startY, controlX, controlY, endX, endY, t0);
            const p1 = this.getQuadraticPoint(this.startX, this.startY, controlX, controlY, endX, endY, t1);

            this.graphic.lineStyle(ARROW_WIDTH, ARROW_COLOR, 1);
            this.graphic.beginPath();
            this.graphic.moveTo(p0.x, p0.y);
            this.graphic.lineTo(p1.x, p1.y);
            this.graphic.strokePath();
        }

        const angle = Math.atan2(endY - this.startY, endX - this.startX);
        const leftX = endX - HEAD_LENGTH * Math.cos(angle - HEAD_ANGLE);
        const leftY = endY - HEAD_LENGTH * Math.sin(angle - HEAD_ANGLE);
        const rightX = endX - HEAD_LENGTH * Math.cos(angle + HEAD_ANGLE);
        const rightY = endY - HEAD_LENGTH * Math.sin(angle + HEAD_ANGLE);

        this.graphic.fillStyle(ARROW_COLOR, 1);
        this.graphic.beginPath();
        this.graphic.moveTo(endX, endY);
        this.graphic.lineTo(leftX, leftY);
        this.graphic.lineTo(rightX, rightY);
        this.graphic.closePath();
        this.graphic.fillPath();
    }

    private getQuadraticPoint(startX: number, startY: number, controlX: number, controlY: number, endX: number, endY: number, t: number)
    {
        const inverseT = 1 - t;
        const x = inverseT * inverseT * startX + 2 * inverseT * t * controlX + t * t * endX;
        const y = inverseT * inverseT * startY + 2 * inverseT * t * controlY + t * t * endY;
        return { x, y };
    }

    updateEnd(endX: number, endY: number)
    {
        this.draw(endX, endY);
    }

    destroy()
    {
        this.graphic.destroy();
    }
}
