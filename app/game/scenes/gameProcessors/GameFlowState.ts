import { TargetPrompt } from "../../shared/protocol";

// Turn/prompt state shared by the scene controllers.
export class GameFlowState
{
    playerIndex: 0 | 1 | null = null;
    isMyTurn: boolean = false;

    awaitingServer: boolean = false;
    awaitingTarget: boolean = false;
    pendingPrompt: TargetPrompt | null = null;
    pendingPlayCardId: string | null = null;
    capturedTargetId: string | null = null;
}
