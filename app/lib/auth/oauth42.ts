import "server-only";

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

async function exchangeCodeForToken(code: string): Promise<string> {
    const res = await fetch(TOKEN_URL, {
        method: "POST",
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
    return data.access_token as string;
}

async function fetchProfile(accessToken: string): Promise<FortyTwoProfile> {
    const res = await fetch(ME_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`42 /v2/me failed: ${res.status}`);
    const data = await res.json();
    return { id: data.id, login: data.login, email: data.email };
}

/** Exchanges the authorization code for a token, then fetches the 42 profile (id, login, email). */
export async function fetchFortyTwoProfile(code: string): Promise<FortyTwoProfile> {
    const accessToken = await exchangeCodeForToken(code);
    return fetchProfile(accessToken);
}

/** Thrown when the 42 account's email already belongs to a local account. */
export class EmailTakenError extends Error {
    constructor() {
        super("A local account already uses this 42 account's email");
    }
}

/**
 * Account linked to this 42 login, created with a unique username if it doesn't exist yet.
 *
 * A local account with the same email is deliberately NOT linked: sign-up never verifies email
 * ownership, so anyone could register with a victim's 42 email, set a password, and wait for the
 * victim's first "Sign in with 42" to hand them the (then shared) account.
 */
export async function findOrCreateUserFromFortyTwo(profile: FortyTwoProfile) {
    const existing = await prisma.user.findUnique({ where: { fortyTwoId: profile.id } });
    if (existing) return existing;

    const email = profile.email.toLocaleLowerCase();
    if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
        throw new EmailTakenError();
    }

    const baseUsername = profile.login.toLocaleLowerCase().slice(0, USERNAME_MAX_LENGTH);
    let username = baseUsername;
    let suffix = 0;
    while (await prisma.user.findUnique({ where: { username } })) {
        suffix += 1;
        username = `${baseUsername}_${suffix}`.slice(0, USERNAME_MAX_LENGTH);
    }

    // A concurrent sign-up can still take the email or username in between: the unique
    // constraints make that create fail, and the callback reports a generic OAuth error.
    return prisma.user.create({
        data: {
            email,
            username,
            fortyTwoId: profile.id,
        },
    });
}

/**
 * Links a 42 account to an existing, signed-in user (profile page). Explicit and authenticated,
 * unlike the automatic email-based linking that was removed (see findOrCreateUserFromFortyTwo).
 *
 * @returns false when this 42 account belongs to another user, or this user is already linked
 *          to a different 42 account.
 */
export async function linkFortyTwoAccount(userId: number, fortyTwoId: number): Promise<boolean> {
    const owner = await prisma.user.findUnique({ where: { fortyTwoId }, select: { id: true } });
    if (owner) return owner.id === userId; // already linked: to us (fine) or to someone else

    // `fortyTwoId: null` in the WHERE: an account already linked to a *different* 42 login is
    // never silently re-linked.
    const { count } = await prisma.user.updateMany({ where: { id: userId, fortyTwoId: null }, data: { fortyTwoId } });
    return count === 1;
}
