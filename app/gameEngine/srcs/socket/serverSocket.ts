import { Server, Socket } from "socket.io";
import { Player } from "../player";
import { Hero } from "../hero";
import { Deck } from "../deck";
import { GameSession, Seat } from "./gameSession";
import { ClientMessage, ServerMessage } from "../shared/protocol";
import { makeDeckFromDeckId, makeDeckFromNames } from "../cardImport/cardLoader";
import { pickRandomAiDeck } from "../cardImport/aiDecks";
import { authenticateCookieHeader, SocketIdentity } from "../auth/session";

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

type WaitingPlayer = { socket: Socket; identity: SocketIdentity; deckId: number; cardBack: number };

// The authenticated user behind a socket, attached by the io.use() middleware below before any
// message handler can run.
function identityOf(socket: Socket): SocketIdentity
{
    return socket.data.identity as SocketIdentity;
}

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

    const reject = (socket: Socket, reason: string): void =>
    {
        const rejection: ServerMessage = { type: "rejected", reason };
        socket.emit("message", rejection);
    };

    // Authenticate once per connection, before any game message is handled: the browser sends the
    // same httpOnly session cookie the Next.js app set (socket.io is proxied under the same origin
    // by nginx), so the seat can be tied to a real account instead of to a socket id. Doing it here
    // rather than per-message also keeps the tokenVersion lookup off the match-start path — the
    // socket is opened while the player is still browsing decks (see PlayModeSelector.tsx).
    io.use(async (socket, next) =>
    {
        try
        {
            const identity = await authenticateCookieHeader(socket.handshake.headers.cookie);
            if (!identity)
                return next(new Error("unauthenticated"));

            socket.data.identity = identity;
            next();
        }
        catch (err)
        {
            console.error("auth middleware failed:", err);
            next(new Error("unauthenticated"));
        }
    });

    io.on("connection", (socket: Socket) =>
    {
        const identity = identityOf(socket);
        console.log(`client connected: ${socket.id} (user ${identity.userId} / ${identity.username})`);

        socket.on("message", async (msg: ClientMessage) =>
        {
            if (msg.type === "resume")
            {
                // The player's socket dropped and came back inside the grace window: hand this new
                // connection to the seat their account already holds. No deck is re-read and no
                // session is rebuilt — the match kept running in memory the whole time.
                const game = liveGames.find(g => g.hasUser(identity.userId));
                if (!game || !game.reattach(identity.userId, socket))
                    reject(socket, "Partie introuvable.");
                return;
            }

            if (msg.type === "readySolo")
            {
                // One live game per account. Keyed on the user rather than the socket so a
                // reconnect can't spin up a second game alongside the one they're already in.
                if (liveGames.some(g => g.hasUser(identity.userId)))
                    return;

                // Player's deck = whatever they chose in the menu (deck builder), verified to
                // actually belong to them. AI's deck = one of the 3 hand-written decks in
                // aiDecks.ts, picked at random — not tied to any account, so the AI can play cards
                // the human player doesn't own.
                let playerDeck: Deck | null, aiDeck: Deck;
                try
                {
                    [playerDeck, aiDeck] = await Promise.all([
                        makeDeckFromDeckId(msg.deckId, identity.userId, "hey"),
                        makeDeckFromNames(pickRandomAiDeck(), "hola"),
                    ]);
                }
                catch (err)
                {
                    // A DB hiccup here must not crash the whole process — that would drop every
                    // other live game too. Fail just this one match start instead.
                    console.error("readySolo: failed to load deck(s):", err);
                    reject(socket, "Erreur serveur, réessaie.");
                    return;
                }
                if (!playerDeck)
                {
                    reject(socket, "Deck introuvable ou vide.");
                    return;
                }

                // Coin flip: don't let the human always go first against the AI.
                const humanIndex: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
                const aiIndex: 0 | 1 = humanIndex === 0 ? 1 : 0;

                const humanPlayer: Player = new Player(new Hero(identity.username), playerDeck, `hero-${humanIndex}`, humanIndex, clampCardBack(msg.cardBack));
                const aiPlayer: Player = new Player(new Hero("AI"), aiDeck, `hero-${aiIndex}`, aiIndex, randomCardBack());

                const players: [Player, Player] = humanIndex === 0 ? [humanPlayer, aiPlayer] : [aiPlayer, humanPlayer];
                const humanSeat: Seat = { kind: "human", socket, userId: identity.userId };
                const seats: [Seat, Seat] = humanIndex === 0
                    ? [humanSeat, { kind: "ai" }]
                    : [{ kind: "ai" }, humanSeat];

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
                const idx: number = waiting.findIndex(w => w.identity.userId === identity.userId);
                if (idx !== -1)
                    waiting.splice(idx, 1);
                return;
            }

            if (msg.type !== "ready")
                return;

            if (liveGames.some(g => g.hasUser(identity.userId)))
                return;

            // Already queued: refresh the socket on the existing entry rather than adding a second
            // one. A reconnect while waiting arrives as a new socket, which under a socket-keyed
            // check would have queued the same account twice.
            const queued = waiting.find(w => w.identity.userId === identity.userId);
            if (queued)
            {
                queued.socket = socket;
                queued.deckId = msg.deckId;
                queued.cardBack = clampCardBack(msg.cardBack);
                return;
            }

            waiting.push({ socket, identity, deckId: msg.deckId, cardBack: clampCardBack(msg.cardBack) });

            // Pair the newcomer with the longest-waiting *different* account — a user must not be
            // matched against themselves (two tabs on the same login).
            const newcomerIdx = waiting.length - 1;
            const opponentIdx = waiting.findIndex(w => w.identity.userId !== identity.userId);
            if (opponentIdx === -1)
                return;

            // Splice the higher index first so the lower one doesn't shift under us.
            const [hi, lo] = newcomerIdx > opponentIdx ? [newcomerIdx, opponentIdx] : [opponentIdx, newcomerIdx];
            const wHi: WaitingPlayer = waiting.splice(hi, 1)[0];
            const wLo: WaitingPlayer = waiting.splice(lo, 1)[0];

            // Coin flip: don't let whoever queued first always go first.
            const [first, second]: [WaitingPlayer, WaitingPlayer] = Math.random() < 0.5 ? [wLo, wHi] : [wHi, wLo];

            let deck0: Deck | null, deck1: Deck | null;
            try
            {
                [deck0, deck1] = await Promise.all([
                    makeDeckFromDeckId(first.deckId, first.identity.userId, "hero_0"),
                    makeDeckFromDeckId(second.deckId, second.identity.userId, "hero_1"),
                ]);
            }
            catch (err)
            {
                // Same reasoning as readySolo above: a DB hiccup must fail this match start,
                // not take down the process (and every other live game with it).
                console.error("ready: failed to load deck(s):", err);
                reject(first.socket, "Erreur serveur, réessaie.");
                reject(second.socket, "Erreur serveur, réessaie.");
                return;
            }

            if (!deck0 || !deck1)
            {
                if (!deck0) reject(first.socket, "Deck introuvable ou vide.");
                if (!deck1) reject(second.socket, "Deck introuvable ou vide.");
                return;
            }

            const player0: Player = new Player(new Hero(first.identity.username, "hero-0"), deck0, "hero-0", 0, first.cardBack);
            const player1: Player = new Player(new Hero(second.identity.username, "hero-1"), deck1, "hero-1", 1, second.cardBack);

            const seat0: Seat = { kind: "human", socket: first.socket, userId: first.identity.userId };
            const seat1: Seat = { kind: "human", socket: second.socket, userId: second.identity.userId };

            const session: GameSession = new GameSession(seat0, seat1, player0, player1, undefined, () => removeGame(session));

            liveGames.push(session);
        });

        socket.on("disconnect", () =>
        {
            console.log(`client disconnected: ${socket.id} (user ${identity.userId})`);

            // Only drop the queue entry if it still belongs to *this* socket: the same account may
            // already have reconnected and refreshed the entry, and that newer connection must not
            // be dequeued by the old socket's late disconnect.
            const idx: number = waiting.findIndex(w => w.socket === socket);
            if (idx !== -1)
                waiting.splice(idx, 1);

            // Starts the reconnect grace period rather than forfeiting outright — see
            // GameSession.handleDisconnect.
            const game: GameSession | undefined = liveGames.find(g => g.hasSocket(socket.id));
            if (game)
                game.handleDisconnect(socket);
        });
    });
}
