import { Server, Socket } from "socket.io";
import { Player } from "../player";
import { Hero } from "../hero";
import { Deck } from "../deck";
import { Hand } from "../hand";
import { makeBasicDeck } from "../deck";
import { GameSession, Seat } from "./gameSession";
import { ClientMessage } from "../shared/protocol";

export function createGameServer(port: number): void
{
    const io = new Server(port, { cors: { origin: "http://localhost:3000" } });

    const waiting: Socket[] = [];
    const sessions: Map<string, GameSession> = new Map(); // keyed by "socketId0|socketId1" or "socketId|ai"

    io.on("connection", (socket: Socket) =>
    {
        console.log("client connected:", socket.id);

        socket.on("message", (msg: ClientMessage) =>
        {
            if (msg.type === "readySolo")
            {
                const player0: Player = new Player(new Hero("Player 1"), makeBasicDeck(), "hero-0", 0);
                const player1: Player = new Player(new Hero("AI"), makeBasicDeck(), "hero-1", 1);

                const humanSeat: Seat = { kind: "human", socket };
                const aiSeat: Seat = { kind: "ai" };

                const session: GameSession = new GameSession(humanSeat, aiSeat, player0, player1);

                sessions.set(socket.id + "|ai", session);
                return;
            }

            if (msg.type !== "ready")
                return;

            if (waiting.includes(socket))
                return;

            waiting.push(socket);

            if (waiting.length >= 2)
            {
                const s0: Socket = waiting.shift()!;
                const s1: Socket = waiting.shift()!;

                //get real deck's from collection
                const player0: Player = new Player(new Hero("Player 1"), makeBasicDeck(), "hero-0", 0);
                const player1: Player = new Player(new Hero("Player 2"), makeBasicDeck(), "hero-1", 1);

                const seat0: Seat = { kind: "human", socket: s0 };
                const seat1: Seat = { kind: "human", socket: s1 };

                const session: GameSession = new GameSession(seat0, seat1, player0, player1);

                sessions.set(s0.id + "|" + s1.id, session);
            }
        });

        socket.on("disconnect", () =>
        {
            console.log("client disconnected:", socket.id);

            const idx: number = waiting.indexOf(socket);
            if (idx !== -1)
                waiting.splice(idx, 1);

            for (const [key, session] of sessions)
            {
                if (key.includes(socket.id))
                {
                    session.handleDisconnect(socket);
                    sessions.delete(key);
                }
            }
        });
    });
}