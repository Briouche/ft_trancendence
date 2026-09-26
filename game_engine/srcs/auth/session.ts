import { jwtVerify } from "jose";
import { prisma } from "../db";

const SESSION_COOKIE = "session";

export type SocketIdentity = { userId: number; username: string };

type SessionPayload = {
    userId: number;
    username: string;
    tokenVersion: number;
};

function readSecret(): Uint8Array
{
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("JWT_SECRET env var is not set");
    return new TextEncoder().encode(secret);
}

function readSessionCookie(cookieHeader: string | undefined): string | null
{
    if (!cookieHeader)
        return null;

    for (const part of cookieHeader.split(";"))
    {
        const eq = part.indexOf("=");
        if (eq === -1)
            continue;
        if (part.slice(0, eq).trim() === SESSION_COOKIE)
            return part.slice(eq + 1).trim();
    }
    return null;
}

// Returns the authenticated user, or null if the cookie is missing/invalid/expired or the session
// was revoked (logout-everywhere, password change) by bumping User.tokenVersion.
export async function authenticateCookieHeader(cookieHeader: string | undefined): Promise<SocketIdentity | null>
{
    const token = readSessionCookie(cookieHeader);
    if (!token)
        return null;

    let payload: SessionPayload;
    try
    {
        const verified = await jwtVerify(token, readSecret(), { algorithms: ["HS256"] });
        payload = verified.payload as unknown as SessionPayload;
    }
    catch
    {
        return null;
    }

    if (typeof payload.userId !== "number" || typeof payload.tokenVersion !== "number")
        return null;

    const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { tokenVersion: true, username: true },
    });
    if (!user || user.tokenVersion !== payload.tokenVersion)
        return null;

    return { userId: payload.userId, username: user.username ?? payload.username };
}
