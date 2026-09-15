import { EventEmitter } from "events";
import { io } from "socket.io-client";
import type { ClientMessage, ServerMessage } from "@/game/shared/protocol";
import type { Difficulty } from "@/game/shared/protocol";

export const EventManager = new EventEmitter();
const socket = io();

socket.on("connect", () =>
{
    EventManager.emit("client:connected");
});

socket.on("connect_error", (err: Error) =>
{
    EventManager.emit("server:rejected", err.message === "unauthenticated"
        ? "Session expirée — reconnecte-toi."
        : "Connexion au serveur de jeu impossible.");
});

socket.on("message", (msg: ServerMessage) =>
{
    if (msg.type === "assigned")
        EventManager.emit("server:assigned", msg.playerIndex);
    else if (msg.type === "state")
        EventManager.emit("server:state", msg.state);
    else if (msg.type === "prompt")
        EventManager.emit("server:prompt", msg.prompt);
    else if (msg.type === "rejected")
        EventManager.emit("server:rejected", msg.reason);
    else if (msg.type === "gameOver")
        EventManager.emit("server:gameOver", msg.winner);
    else if (msg.type === "event")
        EventManager.emit("server:event", msg.event);
    else if (msg.type === "opponentDisconnected")
        EventManager.emit("server:opponentDisconnected", msg.secondsRemaining);
    else if (msg.type === "opponentReconnected")
        EventManager.emit("server:opponentReconnected");
});

EventManager.on("client:readySolo", (source: { difficulty: Difficulty; deckId: number; cardBack: number }) =>
{
    const msg: ClientMessage = { type: "readySolo", difficulty: source.difficulty, deckId: source.deckId, cardBack: source.cardBack };
    socket.emit("message", msg);
});

EventManager.on("client:ready", (source: { deckId: number; cardBack: number }) =>
{
    const msg: ClientMessage = { type: "ready", deckId: source.deckId, cardBack: source.cardBack };
    socket.emit("message", msg);
});

EventManager.on("client:resume", () =>
{
    const msg: ClientMessage = { type: "resume" };
    socket.emit("message", msg);
});

EventManager.on("client:playCard", (source: { cardId: string; boardIndex?: number }) =>
{
    let msg: ClientMessage;

    if (source.boardIndex !== undefined)
        msg = { type: "playCard", cardId: source.cardId, boardIndex: source.boardIndex };
    else
        msg = { type: "playCard", cardId: source.cardId };
    socket.emit("message", msg);
});

EventManager.on("client:requestAttack", (source: { attackerId: string; targetId: string }) =>
{
    const msg: ClientMessage = { type: "attack", attackerId: source.attackerId, targetId: source.targetId };
    socket.emit("message", msg);
});

EventManager.on("client:targetChoice", (targetId: string | null) =>
{
    const msg: ClientMessage = { type: "targetChoice", targetId };
    socket.emit("message", msg);
});

EventManager.on("client:endTurn", () =>
{
    const msg: ClientMessage = { type: "endTurn" };
    socket.emit("message", msg);
});

EventManager.on("client:quit", () =>
{
    const msg: ClientMessage = { type: "quit" };
    socket.emit("message", msg);
});
