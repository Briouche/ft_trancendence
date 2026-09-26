import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { EmailTakenError, fetchFortyTwoProfile, findOrCreateUserFromFortyTwo, getSiteOrigin } from "@/lib/oauth42";
import { createSession } from "@/lib/session";
import { ROUTES } from "@/config/routes";
import { STATE_COOKIE } from "../route";

// 42 OAuth return: checks the anti-CSRF state, then signs the matching account in.
export async function GET(request: NextRequest) {
    const url   = new URL(request.url);
    const code  = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const cookieStore   = await cookies();
    const expectedState = cookieStore.get(STATE_COOKIE)?.value;
    cookieStore.delete(STATE_COOKIE);

    const siteOrigin = getSiteOrigin();

    if (!code || !state || !expectedState || state !== expectedState) {
        return NextResponse.redirect(new URL(`${ROUTES.home}?error=oauth`, siteOrigin));
    }

    try {
        const profile = await fetchFortyTwoProfile(code);
        const user    = await findOrCreateUserFromFortyTwo(profile);
        await createSession(user.id, user.username, user.tokenVersion);
    } catch (err) {
        if (err instanceof EmailTakenError) {
            return NextResponse.redirect(new URL(`${ROUTES.home}?error=oauth_email_taken`, siteOrigin));
        }
        console.error("42 OAuth callback failed:", err);
        return NextResponse.redirect(new URL(`${ROUTES.home}?error=oauth`, siteOrigin));
    }

    return NextResponse.redirect(new URL(ROUTES.home, siteOrigin));
}
