import "server-only";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { USERNAME_MAX_LENGTH } from "@/lib/constants";

const AUTHORIZE_URL = "https://api.intra.42.fr/oauth/authorize";
const TOKEN_URL = "https://api.intra.42.fr/oauth/token";
const ME_URL = "https://api.intra.42.fr/v2/me";

function getEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} env var is not set`);
    return value;
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

interface FortyTwoProfile {
    id:    number;
    login: string;
    email: string;
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

// Finds the account already linked to this 42 login, or creates one. The 42 login is unique on
// 42's side, but can collide with a local (email+password) account that already claimed the same
// username — in that case we append a numeric suffix until we find a free one.
export async function findOrCreateUserFromFortyTwo(profile: FortyTwoProfile) {
    const existing = await prisma.user.findUnique({ where: { fortyTwoId: profile.id } });
    if (existing) return existing;

    const baseUsername = profile.login.toLocaleLowerCase().slice(0, USERNAME_MAX_LENGTH);
    let username = baseUsername;
    let suffix = 0;
    while (await prisma.user.findUnique({ where: { username } })) {
        suffix += 1;
        username = `${baseUsername}_${suffix}`.slice(0, USERNAME_MAX_LENGTH);
    }

    try {
        return await prisma.user.create({
            data: {
                email:      profile.email.toLocaleLowerCase(),
                username,
                fortyTwoId: profile.id,
            },
        });
    } catch (err) {
        // Rare case: a local account already owns this email -> attach fortyTwoId to it instead
        // of failing, so an existing user can link their 42 account.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
            return prisma.user.update({
                where: { email: profile.email.toLocaleLowerCase() },
                data:  { fortyTwoId: profile.id },
            });
        }
        throw err;
    }
}
