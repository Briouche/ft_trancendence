import Phaser from "phaser";
import { ClientGameState } from "../../shared/protocol";

// A task that hasn't settled after this long is abandoned so the rest of the queue can drain.
// Sized against the longest animation that actually goes through here (turnBannerAnimation, at
// 200+100+600+300 = 1200ms), with enough headroom that a loaded machine can't trip it.
//
// Measured on the *scene* clock, not wall-clock: Phaser pauses its game loop — and every tween
// with it — while the tab is hidden, so an animation that is merely frozen mid-way must not be
// mistaken for one that will never finish.
const TASK_TIMEOUT_MS = 5000;

/**
 * Plays event animations one after another in server order; a state received meanwhile is
 * applied (latest only) once the queue is empty.
 *
 * Everything beyond the plain queueing is about one failure mode: GameScene.onServerState holds
 * incoming states here while the queue is busy, so a queue that never drains is a client that can
 * never resync — which is exactly what a reconnect has to do. A task that rejects, or one whose
 * tween onComplete never fires (its target destroyed mid-tween, a lost WebGL context), must
 * therefore not be able to stop the queue.
 */
export class AnimationQueue
{
    private pendingAnimations = 0;
    private queuedState: ClientGameState | null = null;
    private drainCallbacks: (() => void)[] = [];

    private chain: Promise<void> = Promise.resolve();

    // Bumped by reset(). Tasks queued under an older generation are skipped if they haven't run
    // yet, and can no longer touch the counter if they are already in flight.
    private generation = 0;

    constructor(private scene: Phaser.Scene, private onFlush: (state: ClientGameState) => void) {}

    get isBusy(): boolean
    {
        return this.pendingAnimations > 0;
    }

    queueState(state: ClientGameState): void
    {
        this.queuedState = state;
    }

    runAfterDrain(fn: () => void): void
    {
        if (!this.isBusy)
        {
            fn();
            return;
        }
        this.drainCallbacks.push(fn);
    }

    run(task: () => Promise<void>): void
    {
        const generation: number = this.generation;
        this.pendingAnimations++;

        this.chain = this.chain
            .then(() =>
            {
                // A reset() between queueing and running abandons the task: it describes a board
                // the resync that triggered the reset is about to replace wholesale.
                if (generation !== this.generation)
                    return undefined;
                return this.withTimeout(task(), generation);
            })
            // Swallowed on purpose. `this.chain` is the only chain there is, so letting a
            // rejection through would leave it permanently rejected and silently skip every later
            // task — no animation for the rest of the match, no drain, and therefore no resync.
            // Note .finally() would not do: it re-throws the upstream rejection after running.
            .catch((err) => console.error("Animation task failed (queue kept running):", err))
            .then(() => this.settle(generation));
    }

    // Drops everything in flight and starts clean. Called when the client resyncs from scratch
    // (a reconnect): the server is about to push a full state, whatever is queued describes the
    // board as it was before the drop, and one wedged task must not be able to hold that state
    // hostage — see GameScene's client:connected handler.
    reset(): void
    {
        this.generation++;
        this.pendingAnimations = 0;
        this.queuedState = null;
        this.chain = Promise.resolve();

        // Run them rather than drop them: the only drain callback today is the game-over overlay,
        // and losing it would leave the player on a dead board with no result.
        const callbacks: (() => void)[] = this.drainCallbacks;
        this.drainCallbacks = [];
        callbacks.forEach((fn) => fn());
    }

    private withTimeout(task: Promise<void>, generation: number): Promise<void>
    {
        return new Promise<void>((resolve, reject) =>
        {
            const timer = this.scene.time.delayedCall(TASK_TIMEOUT_MS, () =>
            {
                // A reset() already abandoned this task and moved on, so the queue is not stuck
                // and there is nothing to warn about — just let the orphaned promise settle.
                if (generation === this.generation)
                    console.warn(`Animation task still unsettled after ${TASK_TIMEOUT_MS}ms — abandoning it so the queue keeps draining.`);
                resolve();
            });

            task.then(
                () => { timer.remove(); resolve(); },
                (err) => { timer.remove(); reject(err); });
        });
    }

    private settle(generation: number): void
    {
        // reset() already zeroed the counter for this generation; decrementing here would drive
        // pendingAnimations negative and leave isBusy stuck false for the tasks that follow.
        if (generation !== this.generation)
            return;

        this.pendingAnimations--;
        if (this.pendingAnimations > 0)
            return;

        if (this.queuedState)
        {
            const state: ClientGameState = this.queuedState;
            this.queuedState = null;
            this.onFlush(state);
        }
        if (this.drainCallbacks.length > 0)
        {
            const callbacks: (() => void)[] = this.drainCallbacks;
            this.drainCallbacks = [];
            callbacks.forEach((fn) => fn());
        }
    }
}
