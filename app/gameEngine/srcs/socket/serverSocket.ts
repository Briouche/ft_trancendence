import { Server, Socket } from "socket.io";
import { Player } from "../player";
import { Hero } from "../hero";
import { Deck } from "../deck";
import { Hand } from "../hand";
import { makeBasicDeck } from "../deck";
import { GameSession, Seat } from "./gameSession";
import { ClientMessage, ServerMessage } from "../shared/protocol";
import { makeDeckFromDeckId } from "../cardImport/cardLoader";

type WaitingPlayer = { socket: Socket; deckId: number };

export function createGameServer(port: number): void
{
    const io = new Server(port, { cors: { origin: "http://localhost:3000" } });

    const waiting: WaitingPlayer[] = [];
    const sessions: Map<string, GameSession> = new Map(); // keyed by "socketId0|socketId1" or "socketId|ai"

    io.on("connection", (socket: Socket) =>
    {
        console.log("client connected:", socket.id);

        socket.on("message", async (msg: ClientMessage) =>
        {
            if (msg.type === "readySolo")
            {
                // Deck du joueur = celui choisi dans le menu (deck builder), plus de deck codé en
                // dur ni pioché au hasard dans la collection — voir PlayModeSelector.tsx. L'IA
                // n'a pas de deck sauvegardé, elle garde le deck de base existant.
                const playerDeck: Deck | null = await makeDeckFromDeckId(msg.deckId, "hey");
                if (!playerDeck)
                {
                    const rejection: ServerMessage = { type: "rejected", reason: "Deck introuvable ou vide." };
                    socket.emit("message", rejection);
                    return;
                }

                const player0: Player = new Player(new Hero("Player 1"), playerDeck, "hero-0", 0);
                const player1: Player = new Player(new Hero("AI"), makeBasicDeck("hola", 2), "hero-1", 1);

                const humanSeat: Seat = { kind: "human", socket };
                const aiSeat: Seat = { kind: "ai" };

                const session: GameSession = new GameSession(humanSeat, aiSeat, player0, player1, msg.difficulty);

                sessions.set(socket.id + "|ai", session);
                return;
            }

            if (msg.type !== "ready")
                return;

            if (waiting.some(w => w.socket === socket))
                return;

            waiting.push({ socket, deckId: msg.deckId });

            if (waiting.length >= 2)
            {
                const w0: WaitingPlayer = waiting.shift()!;
                const w1: WaitingPlayer = waiting.shift()!;

                // Deck de chaque joueur = celui qu'il a choisi dans le menu, plus de pioche
                // aléatoire dans toute la collection globale — voir PlayModeSelector.tsx.
                const [deck0, deck1] = await Promise.all([
                    makeDeckFromDeckId(w0.deckId, "hero_0"),
                    makeDeckFromDeckId(w1.deckId, "hero_1"),
                ]);

                if (!deck0 || !deck1)
                {
                    const rejection: ServerMessage = { type: "rejected", reason: "Deck introuvable ou vide." };
                    if (!deck0) w0.socket.emit("message", rejection);
                    if (!deck1) w1.socket.emit("message", rejection);
                    return;
                }

                const player0: Player = new Player(new Hero("Jimmy", "hero-0"), deck0, "hero-0", 0);
                const player1: Player = new Player(new Hero("Franky", "hero-1"), deck1, "hero-1", 1);

                const seat0: Seat = { kind: "human", socket: w0.socket };
                const seat1: Seat = { kind: "human", socket: w1.socket };

                const session: GameSession = new GameSession(seat0, seat1, player0, player1);

                sessions.set(w0.socket.id + "|" + w1.socket.id, session);
            }
        });

        socket.on("disconnect", () =>
        {
            console.log("client disconnected:", socket.id);

            const idx: number = waiting.findIndex(w => w.socket === socket);
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