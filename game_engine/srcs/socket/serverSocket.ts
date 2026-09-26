import { IncomingMessage } from "http";
import { Server, Socket } from "socket.io";
import { Player } from "../player";
import { Hero } from "../hero";
import { Deck } from "../deck";
import { GameSession, Seat } from "./gameSession";
import { ClientMessage, ServerMessage } from "../shared/protocol";
import { makeDeckFromDeckId, makeDeckFromNames } from "../cardImport/cardLoader";
import { pickRandomAiDeck } from "../cardImport/aiDecks";
import { authenticateCookieHeader, SocketIdentity } from "../auth/session";
import { DIFFICULTY_PRESETS, Difficulty } from "../ai/types";

// Keep in sync with app/lib/cardBacks.ts.
const CARD_BACK_COUNT = 8;

function clampCardBack(value: number): number
{
    return Number.isInteger(value) && value >= 0 && value < CARD_BACK_COUNT ? value : 0;
}

function randomCardBack(): number
{
    return Math.floor(Math.random() * CARD_BACK_COUNT);
}

// The client is not trusted: anything that reaches the engine is checked here first. An unknown
// difficulty used to leave DIFFICULTY_PRESETS[difficulty] undefined and the AI loop dead, so the
// match hung forever on the AI's turn.
function isDifficulty(value: unknown): value is Difficulty
{
    return typeof value === "string" && Object.prototype.hasOwnProperty.call(DIFFICULTY_PRESETS, value);
}

function isDeckId(value: unknown): value is number
{
    return Number.isSafeInteger(value) && (value as number) > 0;
}

// Origin must match the Host the request was sent to (nginx forwards it). Requests without an
// Origin come from non-browser clients, which still need a valid session cookie to get in.
function isSameOrigin(req: IncomingMessage, callback: (err: string | null | undefined, success: boolean) => void): void
{
    const origin = req.headers.origin;
    if (!origin)
        return callback(null, true);

    let originHost: string;
    try
    {
        originHost = new URL(origin).host;
    }
    catch
    {
        return callback("invalid origin", false);
    }
    callback(originHost === req.headers.host ? null : "cross-origin request refused", originHost === req.headers.host);
}

type WaitingPlayer = { socket: Socket; identity: SocketIdentity; deckId: number; cardBack: number };

// The authenticated user behind a socket, attached by the io.use() middleware below before any
// message handler can run.
function identityOf(socket: Socket): SocketIdentity
{
    return socket.data.identity as SocketIdentity;
}

// Socket.IO server: solo games start immediately against the AI, multiplayer pairs the first
// two players in the queue. Live sessions are kept so a reconnecting socket finds its game.
export function createGameServer(port: number): void
{
    // The client always connects through the nginx proxy on the page's own origin, so no CORS is
    // needed. The Origin check matters because WebSocket upgrades bypass CORS entirely: without it
    // any site could open a socket that the browser authenticates with the player's session cookie
    // (cross-site WebSocket hijacking) and play moves on their behalf.
    const io = new Server(port, { allowRequest: isSameOrigin, connectionStateRecovery: {} });

    const waiting: WaitingPlayer[] = [];
    const liveGames: GameSession[] = [];

    const removeGame = (game: GameSession): void =>
    {
        const idx = liveGames.indexOf(game);
        if (idx !== -1)
            liveGames.splice(idx, 1);
    };

    const reject = (socket: Socket, reason: string, fatal: boolean = false): void =>
    {
        const rejection: ServerMessage = { type: "rejected", reason, fatal };
        socket.emit("message", rejection);
    };

    // Hands a socket back the live game
    const resumeExisting = (socket: Socket, userId: number): boolean =>
    {
        const game = liveGames.find(g => g.hasUser(userId));
        if (!game)
            return false;

        // Found the game but can't rejoin it (it's finishing): still an answer, not silence.
        if (!game.reattach(userId, socket))
            reject(socket, "Partie déjà en cours.", true);

        return true;
    };

    // Authenticate once per connection, before any game message is handled
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
            if (typeof msg !== "object" || msg === null)
                return;

            if (msg.type === "resume")
            {
                // The player's socket dropped and came back inside the grace window: hand this new
                // connection to the seat their account already holds. No deck is re-read and no
                // session is rebuilt — the match kept running in memory the whole time.
                if (!resumeExisting(socket, identity.userId))
                    reject(socket, "Partie introuvable.", true);
                return;
            }

            if (msg.type === "readySolo")
            {
                if (resumeExisting(socket, identity.userId))
                    return;

                if (!isDifficulty(msg.difficulty) || !isDeckId(msg.deckId))
                {
                    reject(socket, "Requête invalide.");
                    return;
                }

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
                    console.error("readySolo: failed to load deck(s):", err);
                    reject(socket, "Erreur serveur, réessaie.");
                    return;
                }
                if (!playerDeck)
                {
                    reject(socket, "Deck introuvable ou vide.");
                    return;
                }

                // Coin flip for who goes first.
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

            if (resumeExisting(socket, identity.userId))
                return;

            if (!isDeckId(msg.deckId))
            {
                reject(socket, "Requête invalide.");
                return;
            }

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
            const game: GameSession | undefined = liveGames.find(g => g.hasSocket(socket));
            if (game)
                game.handleDisconnect(socket);
        });
    });
}
