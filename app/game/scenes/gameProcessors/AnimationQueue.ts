import { ClientGameState } from "../../shared/protocol";

// Serializes GameEvent animations via run() so they always play in the exact order the server
// sent them, never overlapping (e.g. a draw animation firing mid-attack would look wrong even
// though the two events are logically independent). While animations are in flight, incoming
// state pushes are held in `queuedState` instead of applied immediately (see
// queueState/GameScene.onServerState) — only the latest is kept, since older ones are superseded
// and applying one mid-animation would let the board visually jump ahead. Flushed once the queue
// fully drains.
export class AnimationQueue
{
    private pendingAnimations = 0;
    private queuedState: ClientGameState | null = null;
    private drainCallbacks: (() => void)[] = [];

    private chain: Promise<void> = Promise.resolve();

    constructor(private onFlush: (state: ClientGameState) => void) {}

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
        this.pendingAnimations++;
        this.chain = this.chain.then(task).finally(() =>
        {
            this.pendingAnimations--;
            if (this.pendingAnimations === 0)
            {
                if (this.queuedState)
                {
                    const state = this.queuedState;
                    this.queuedState = null;
                    this.onFlush(state);
                }
                if (this.drainCallbacks.length > 0)
                {
                    const callbacks = this.drainCallbacks;
                    this.drainCallbacks = [];
                    callbacks.forEach((fn) => fn());
                }
            }
        });
    }
}
