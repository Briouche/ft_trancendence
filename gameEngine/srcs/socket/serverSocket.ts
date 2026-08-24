import { Server, Socket } from "socket.io";
import { Player } from "../player";
import { Hero } from "../hero";
import { Deck } from "../deck";
import { Hand } from "../hand";
import { makeBasicDeck } from "../deck";
import { GameSession } from "./gameSession";
import { ClientMessage } from "../shared/protocol";

export function createGameServer(port: number): void
{
    const io = new Server(port, { cors: { origin: "http://localhost:3000" } });

    const waiting: Socket[] = [];
    const sessions: Map<string, GameSession> = new Map(); // keyed by "socketId0|socketId1"

    io.on("connection", (socket: Socket) =>
    {
        console.log("client connected:", socket.id);

        socket.on("message", (msg: ClientMessage) =>
        {
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
                const player0: Player = new Player(new Hero("Jimmy", "hero-0"), makeBasicDeck("0.", 3), "hero-0", 0);
                const player1: Player = new Player(new Hero("Franky", "hero-1"), makeBasicDeck("1.", 1), "hero-1", 1);

                const session: GameSession = new GameSession(s0, s1, player0, player1);

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
