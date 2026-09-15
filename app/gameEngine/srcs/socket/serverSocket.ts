import { Server, Socket } from "socket.io";
import { Player } from "../player";
import { Hero } from "../hero";
import { Deck } from "../deck";
import { Hand } from "../hand";
import { GameSession, Seat } from "./gameSession";
import { ClientMessage, ServerMessage } from "../shared/protocol";
import { makeDeckFromDeckId, makeDeckFromNames, getUsernameForDeck, getUserIdForDeck } from "../cardImport/cardLoader";
import { pickRandomAiDeck } from "../cardImport/aiDecks";

// Keep in sync with app/lib/cardBacks.ts (Next.js) — same deliberate duplication as the rest of
// shared/protocol.ts; this process has no access to that alias.
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
    const io = new Server(port, { cors: { origin: "http://localhost:3000" } });

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

        socket.on("message", async (msg: ClientMessage) =>
        {
            if (msg.type === "readySolo")
            {
                // Never spin up a second game for a socket that already has a live one.
                if (liveGames.some(g => g.hasSocket(socket.id)))
                    return;

                // Player's deck = whatever they chose in the menu (deck builder) — no more
                // hardcoded deck or random pull from the collection, see PlayModeSelector.tsx.
                // AI's deck = one of the 3 hand-written decks in aiDecks.ts, picked at random —
                // not tied to any account, so the AI can play cards the human player doesn't own.
                let playerDeck: Deck | null, aiDeck: Deck, username: string | null, userId: number | null;
                try
                {
                    [playerDeck, aiDeck, username, userId] = await Promise.all([
                        makeDeckFromDeckId(msg.deckId, "hey"),
                        makeDeckFromNames(pickRandomAiDeck(), "hola"),
                        getUsernameForDeck(msg.deckId),
                        getUserIdForDeck(msg.deckId),
                    ]);
                }
                catch (err)
                {
                    // A DB hiccup here must not crash the whole process — that would drop every
                    // other live game too. Fail just this one match start instead.
                    console.error("readySolo: failed to load deck(s):", err);
                    const rejection: ServerMessage = { type: "rejected", reason: "Erreur serveur, réessaie." };
                    socket.emit("message", rejection);
                    return;
                }
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
                    ? [{ kind: "human", socket, userId }, { kind: "ai" }]
                    : [{ kind: "ai" }, { kind: "human", socket, userId }];

                const session: GameSession = new GameSession(seats[0], seats[1], players[0], players[1], msg.difficulty, () => removeGame(session));

                liveGames.push(session);
                return;
            }

            if (msg.type === "quit")
            {
                // Quitting while still queued (before any GameSession exists) never disconnects
                // the socket — see EventManager.ts, the socket is a page-lifetime singleton that
                // survives client-side navigation — so it has to be handled explicitly here,
                // same as the "disconnect" handler below already does.
                const idx: number = waiting.findIndex(w => w.socket === socket);
                if (idx !== -1)
                    waiting.splice(idx, 1);
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

                let deck0: Deck | null, deck1: Deck | null, username0: string | null, username1: string | null, userId0: number | null, userId1: number | null;
                try
                {
                    [deck0, deck1, username0, username1, userId0, userId1] = await Promise.all([
                        makeDeckFromDeckId(first.deckId, "hero_0"),
                        makeDeckFromDeckId(second.deckId, "hero_1"),
                        getUsernameForDeck(first.deckId),
                        getUsernameForDeck(second.deckId),
                        getUserIdForDeck(first.deckId),
                        getUserIdForDeck(second.deckId),
                    ]);
                }
                catch (err)
                {
                    // Same reasoning as readySolo above: a DB hiccup must fail this match start,
                    // not take down the process (and every other live game with it).
                    console.error("ready: failed to load deck(s):", err);
                    const rejection: ServerMessage = { type: "rejected", reason: "Erreur serveur, réessaie." };
                    first.socket.emit("message", rejection);
                    second.socket.emit("message", rejection);
                    return;
                }

                if (!deck0 || !deck1)
                {
                    const rejection: ServerMessage = { type: "rejected", reason: "Deck introuvable ou vide." };
                    if (!deck0) first.socket.emit("message", rejection);
                    if (!deck1) second.socket.emit("message", rejection);
                    return;
                }

                const player0: Player = new Player(new Hero(username0 ?? "Player 1", "hero-0"), deck0, "hero-0", 0, first.cardBack);
                const player1: Player = new Player(new Hero(username1 ?? "Player 2", "hero-1"), deck1, "hero-1", 1, second.cardBack);

                const seat0: Seat = { kind: "human", socket: first.socket, userId: userId0 };
                const seat1: Seat = { kind: "human", socket: second.socket, userId: userId1 };

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