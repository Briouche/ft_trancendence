import { Server, Socket } from "socket.io";
import { Player } from "../player";
import { Hero } from "../hero";
import { Deck } from "../deck";
import { Hand } from "../hand";
import { GameSession, Seat } from "./gameSession";
import { ClientMessage, ServerMessage } from "../shared/protocol";
import { makeDeckFromDeckId, makeDeckFromNames, getUsernameForDeck } from "../cardImport/cardLoader";
import { pickRandomAiDeck } from "../cardImport/aiDecks";

// Garde en phase avec app/lib/cardBacks.ts (Next.js) — même duplication volontaire que le reste
// de shared/protocol.ts, ce process n'a pas accès à cet alias.
const CARD_BACK_COUNT = 8;

function clampCardBack(value: number): number
{
    return Number.isInteger(value) && value >= 0 && value < CARD_BACK_COUNT ? value : 0;
}

function randomCardBack(): number
{
    return Math.floor(Math.random() * CARD_BACK_COUNT);
}

type WaitingPlayer = { socket: Socket; deckId: number; cardBack: number };

export function createGameServer(port: number): void
{
    const io = new Server(port, { cors: { origin: "http://localhost:3000" }, connectionStateRecovery: {} });

    const waiting: WaitingPlayer[] = [];
    const liveGames: GameSession[] = [];

    const removeGame = (game: GameSession): void =>
    {
        const idx = liveGames.indexOf(game);
        if (idx !== -1)
            liveGames.splice(idx, 1);
    };

    io.on("connection", (socket: Socket) =>
    {
        console.log("client connected:", socket.id);

        // Same socket id as an already-live game
        const existingGame: GameSession | undefined = liveGames.find(g => g.hasSocket(socket.id));
        if (existingGame)
        {
            console.log("reconnecting socket to its live game:", socket.id);
            existingGame.reconnect(socket);

            socket.on("disconnect", () =>
            {
                console.log("client disconnected:", socket.id);
                existingGame.handleDisconnect(socket);
            });
            return;
        }

        socket.on("message", async (msg: ClientMessage) =>
        {
            if (msg.type === "readySolo")
            {
                // Never spin up a second game for a socket that already has a live one.
                if (liveGames.some(g => g.hasSocket(socket.id)))
                    return;

                // Deck du joueur = celui choisi dans le menu (deck builder), plus de deck codé en
                // dur ni pioché au hasard dans la collection — voir PlayModeSelector.tsx. Deck de
                // l'IA = un des 3 decks écrits à la main dans aiDecks.ts, tiré au sort — pas lié à
                // un compte, donc joue des cartes même si le joueur humain ne les possède pas.
                const [playerDeck, aiDeck, username]: [Deck | null, Deck, string | null] = await Promise.all([
                    makeDeckFromDeckId(msg.deckId, "hey"),
                    makeDeckFromNames(pickRandomAiDeck(), "hola"),
                    getUsernameForDeck(msg.deckId),
                ]);
                if (!playerDeck)
                {
                    const rejection: ServerMessage = { type: "rejected", reason: "Deck introuvable ou vide." };
                    socket.emit("message", rejection);
                    return;
                }

                // Coin flip: don't let the human always go first against the AI.
                const humanIndex: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
                const aiIndex: 0 | 1 = humanIndex === 0 ? 1 : 0;

                const humanPlayer: Player = new Player(new Hero(username ?? "Player"), playerDeck, `hero-${humanIndex}`, humanIndex, clampCardBack(msg.cardBack));
                const aiPlayer: Player = new Player(new Hero("AI"), aiDeck, `hero-${aiIndex}`, aiIndex, randomCardBack());

                const players: [Player, Player] = humanIndex === 0 ? [humanPlayer, aiPlayer] : [aiPlayer, humanPlayer];
                const seats: [Seat, Seat] = humanIndex === 0
                    ? [{ kind: "human", socket }, { kind: "ai" }]
                    : [{ kind: "ai" }, { kind: "human", socket }];

                const session: GameSession = new GameSession(seats[0], seats[1], players[0], players[1], msg.difficulty, () => removeGame(session));

                liveGames.push(session);
                return;
            }

            if (msg.type !== "ready")
                return;

            if (liveGames.some(g => g.hasSocket(socket.id)))
                return;

            if (waiting.some(w => w.socket === socket))
                return;

            waiting.push({ socket, deckId: msg.deckId, cardBack: clampCardBack(msg.cardBack) });

            if (waiting.length >= 2)
            {
                const w0: WaitingPlayer = waiting.shift()!;
                const w1: WaitingPlayer = waiting.shift()!;

                // Coin flip: don't let whoever queued first always go first.
                const [first, second]: [WaitingPlayer, WaitingPlayer] = Math.random() < 0.5 ? [w0, w1] : [w1, w0];

                const [deck0, deck1, username0, username1] = await Promise.all([
                    makeDeckFromDeckId(first.deckId, "hero_0"),
                    makeDeckFromDeckId(second.deckId, "hero_1"),
                    getUsernameForDeck(first.deckId),
                    getUsernameForDeck(second.deckId),
                ]);

                if (!deck0 || !deck1)
                {
                    const rejection: ServerMessage = { type: "rejected", reason: "Deck introuvable ou vide." };
                    if (!deck0) first.socket.emit("message", rejection);
                    if (!deck1) second.socket.emit("message", rejection);
                    return;
                }

                const player0: Player = new Player(new Hero(username0 ?? "Player 1", "hero-0"), deck0, "hero-0", 0, first.cardBack);
                const player1: Player = new Player(new Hero(username1 ?? "Player 2", "hero-1"), deck1, "hero-1", 1, second.cardBack);

                const seat0: Seat = { kind: "human", socket: first.socket };
                const seat1: Seat = { kind: "human", socket: second.socket };

                const session: GameSession = new GameSession(seat0, seat1, player0, player1, undefined, () => removeGame(session));

                liveGames.push(session);
            }
        });

        socket.on("disconnect", () =>
        {
            console.log("client disconnected:", socket.id);

            const idx: number = waiting.findIndex(w => w.socket === socket);
            if (idx !== -1)
                waiting.splice(idx, 1);

            const game: GameSession | undefined = liveGames.find(g => g.hasSocket(socket.id));
            if (game)
                game.handleDisconnect(socket);
        });
    });
}