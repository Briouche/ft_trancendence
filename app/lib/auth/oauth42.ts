import "server-only";
import { giveStarterDeck } from "@/lib/starterDecks";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { USERNAME_MAX_LENGTH } from "@/lib/auth/requirements";

// "Sign in with 42" OAuth flow: authorize URL, code exchange, profile fetch, account lookup.

const AUTHORIZE_URL = "https://api.intra.42.fr/oauth/authorize";
const TOKEN_URL = "https://api.intra.42.fr/oauth/token";
const ME_URL = "https://api.intra.42.fr/v2/me";

interface FortyTwoProfile {
    id: number;
    login: string;
    email: string;
}

function getEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} env var is not set`);
    return value;
}

/** Public origin of the site, taken from FT_REDIRECT_URI. */
export function getSiteOrigin(): string {
    return new URL(getEnv("FT_REDIRECT_URI")).origin;
}

/** URL of 42's authorization page for this app, carrying the anti-CSRF `state`. */
export function buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
        client_id: getEnv("FT_CLIENT_ID"),
        redirect_uri: getEnv("FT_REDIRECT_URI"),
        response_type: "code",
        scope: "public",
        state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
}

// 42's API is sometimes slow; a hung request must not hold the callback open forever.
const API_TIMEOUT_MS = 10_000;

async function exchangeCodeForToken(code: string): Promise<string> {
    const res = await fetch(TOKEN_URL, {
        method: "POST",
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            grant_type: "authorization_code",
            client_id: getEnv("FT_CLIENT_ID"),
            client_secret: getEnv("FT_CLIENT_SECRET"),
            code,
            redirect_uri: getEnv("FT_REDIRECT_URI"),
        }),
    });
    if (!res.ok) throw new Error(`42 token exchange failed: ${res.status}`);
    const data = await res.json();
    if (typeof data.access_token !== "string") throw new Error("42 token exchange: no access_token");
    return data.access_token;
}

async function fetchProfile(accessToken: string): Promise<FortyTwoProfile> {
    const res = await fetch(ME_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`42 /v2/me failed: ${res.status}`);
    const data = await res.json();
    if (typeof data.id !== "number" || typeof data.login !== "string" || typeof data.email !== "string") {
        throw new Error("42 /v2/me: unexpected profile shape");
    }
    return { id: data.id, login: data.login, email: data.email };
}

/** Exchanges the authorization code for a token, then fetches the 42 profile (id, login, email). */
export async function fetchFortyTwoProfile(code: string): Promise<FortyTwoProfile> {
    const accessToken = await exchangeCodeForToken(code);
    return fetchProfile(accessToken);
}

// Account linked to this 42 login, created with a unique username if it doesn't exist yet;
// an existing local account with the same email gets linked instead.
/** Thrown when the 42 account's email already belongs to a local account. */
export class EmailTakenError extends Error {
    constructor() {
        super("A local account already uses this 42 account's email");
    }
}

/**
 * Account linked to this 42 id, created on first use with a free username derived from the 42
 * login. An existing local account with the same email is *not* linked automatically: whoever
 * controls a 42 account using that address would otherwise take the local account over. Its
 * owner links 42 from their profile instead (see linkFortyTwoAccount).
 */
export async function findOrCreateUserFromFortyTwo(profile: FortyTwoProfile) {
    const existing = await prisma.user.findUnique({ where: { fortyTwoId: profile.id } });
    if (existing) return existing;

    const email = profile.email.toLowerCase();
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) throw new EmailTakenError();

    // 42 logins may contain characters our usernames don't allow ("-", "_").
    const baseUsername = profile.login.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, USERNAME_MAX_LENGTH - 4) || "player";
    for (let suffix = 0; suffix < 1000; suffix++) {
        const username = suffix === 0 ? baseUsername : `${baseUsername}${suffix}`;
        try {
            return await prisma.user.create({ data: { email, username, fortyTwoId: profile.id } });
        } catch (err) {
            if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") throw err;
            const target = String(err.meta?.target ?? "");
            // Signed up with that email or 42 id in the meantime: same answer as above / reuse it.
            if (target.includes("email")) throw new EmailTakenError();
            if (target.includes("fortyTwoId")) return prisma.user.findUniqueOrThrow({ where: { fortyTwoId: profile.id } });
            // Username taken: try the next suffix.
        }
    }
    throw new Error("Could not find a free username for this 42 login");
}

/**
 * Links a 42 account to the signed-in user (from the profile page). False when that 42 account
 * already belongs to another user, or this user is already linked to a different one.
 */
export async function linkFortyTwoAccount(userId: number, fortyTwoId: number): Promise<boolean> {
    const owner = await prisma.user.findUnique({ where: { fortyTwoId }, select: { id: true } });
    if (owner) return owner.id === userId;
    try {
        const { count } = await prisma.user.updateMany({ where: { id: userId, fortyTwoId: null }, data: { fortyTwoId } });
        return count === 1;
    } catch (err) {
        // Linked to someone else between the check and the write.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return false;
        throw err;
    }
}
