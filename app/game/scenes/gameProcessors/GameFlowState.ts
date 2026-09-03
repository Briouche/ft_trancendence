import { TargetPrompt } from "../../shared/protocol";

//shared info for current gamestate,
// tells if we're currently waiting for the server
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
