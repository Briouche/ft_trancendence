import { EventEmitter } from "events";
import { io } from "socket.io-client";
import type { ClientMessage, ServerMessage } from "@/game/shared/protocol";
import type { Difficulty } from "@/game/shared/protocol";

// The game server (gameEngine/) is its own Node process, separate from the Next.js app, but
// reachable under the SAME origin — nginx proxies /socket.io/ to it (see proxy/dev.conf and
// proxy/prod.conf.template) so the client never needs to know its actual host/port. Connecting
// to a hardcoded host:port here would only work from whichever machine happens to have that
// port reachable (e.g. bypassing the proxy entirely), breaking for anyone else.

//socket connects to engine and eventmanager connects to phaser
//socket.on ==> socket listens to message from server and emits on phaser with eventmanager
//eventmanager.on ==> listens to phaser for requests from the player to send to the socket

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

EventManager.on("client:quit", () =>
{
    const msg: ClientMessage = { type: "quit" };
    socket.emit("message", msg);
});
