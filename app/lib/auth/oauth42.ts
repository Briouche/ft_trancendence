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
    id:    number;
    login: string;
    email: string;
}

function getEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} env var is not set`);
    return value;
}

// Public origin of the site, taken from FT_REDIRECT_URI.
export function getSiteOrigin(): string {
    return new URL(getEnv("FT_REDIRECT_URI")).origin;
}

export function buildAuthorizeUrl(state: string): string {
    const params = new URLSearchParams({
        client_id:     getEnv("FT_CLIENT_ID"),
        redirect_uri:  getEnv("FT_REDIRECT_URI"),
        response_type: "code",
        scope:         "public",
        state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
}

async function exchangeCodeForToken(code: string): Promise<string> {
    const res = await fetch(TOKEN_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            grant_type:    "authorization_code",
            client_id:     getEnv("FT_CLIENT_ID"),
            client_secret: getEnv("FT_CLIENT_SECRET"),
            code,
            redirect_uri:  getEnv("FT_REDIRECT_URI"),
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

export async function fetchFortyTwoProfile(code: string): Promise<FortyTwoProfile> {
    const accessToken = await exchangeCodeForToken(code);
    return fetchProfile(accessToken);
}

export class FortyTwoEmailTakenError extends Error {
    constructor() {
        super("A local account already uses this 42 account's email");
    }
}

async function emailTaken(email: string): Promise<boolean> {
    return (await prisma.user.findUnique({ where: { email }, select: { id: true } })) !== null;
}

// Account linked to this 42 login, created with a unique username if it doesn't exist yet.
export async function findOrCreateUserFromFortyTwo(profile: FortyTwoProfile) {
    const existing = await prisma.user.findUnique({ where: { fortyTwoId: profile.id } });
    if (existing) return existing;

    const email = profile.email.toLocaleLowerCase();
    if (await emailTaken(email)) throw new FortyTwoEmailTakenError();

    const baseUsername = profile.login.toLocaleLowerCase().slice(0, USERNAME_MAX_LENGTH);
    let username = baseUsername;
    let suffix = 0;
    while (await prisma.user.findUnique({ where: { username } })) {
        suffix += 1;
        username = `${baseUsername}_${suffix}`.slice(0, USERNAME_MAX_LENGTH);
    }

    try {
        return await prisma.$transaction(async (tx) => {
            const created = await tx.user.create({
            data: {
                email,
                username,
                fortyTwoId: profile.id,
            },
            });
            await giveStarterDeck(tx, created.id);
            return created;
        });
    } catch (err) {
        // Lost a race since the checks above: a concurrent callback for the same 42 login created
        // the account first (sign in to it), or someone registered this email in between.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            const raced = await prisma.user.findUnique({ where: { fortyTwoId: profile.id } });
            if (raced) return raced;
            if (await emailTaken(email)) throw new FortyTwoEmailTakenError();
        }
        throw err;
    }
}
