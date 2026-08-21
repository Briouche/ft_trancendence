import { ClientGameState } from "../../shared/protocol";

export class AnimationQueue
{
    private pendingAnimations = 0;
    private queuedState: ClientGameState | null = null;

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

    run(task: () => Promise<void>): void
    {
        this.pendingAnimations++;
        this.chain = this.chain.then(task).finally(() =>
        {
            this.pendingAnimations--;
            if (this.pendingAnimations === 0 && this.queuedState)
            {
                const state = this.queuedState;
                this.queuedState = null;
                this.onFlush(state);
            }
        });
    }
}
