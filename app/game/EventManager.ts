import { EventEmitter } from "events";
import { io } from "socket.io-client";
import type { ClientMessage, ServerMessage } from "@/game/shared/protocol";
import type { Difficulty } from "@/game/shared/protocol";

// Bridge between the socket.io connection to the game server and Phaser:
// server messages are re-emitted as "server:*" events, "client:*" events are sent to the server.
// The socket targets the page's own origin; nginx proxies /socket.io/ to the game server.

export const EventManager = new EventEmitter();
const socket = io();

socket.on("connect", () =>
{
    EventManager.emit("client:connected");
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
