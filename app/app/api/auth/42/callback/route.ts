import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchFortyTwoProfile, findOrCreateUserFromFortyTwo } from "@/lib/oauth42";
import { createSession } from "@/lib/session";
import { ROUTES } from "@/config/routes";
import { STATE_COOKIE } from "../route";

// 42 redirects back here after authorization: verify the state we set earlier (CSRF guard),
// exchange the code for a profile, find-or-create the local account, then open the same
// session as email+password login (createSession) — the rest of the app needs to know nothing more.
export async function GET(request: NextRequest) {
    const url   = new URL(request.url);
    const code  = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const cookieStore   = await cookies();
    const expectedState = cookieStore.get(STATE_COOKIE)?.value;
    cookieStore.delete(STATE_COOKIE);

    if (!code || !state || !expectedState || state !== expectedState) {
        return NextResponse.redirect(new URL(`${ROUTES.home}?error=oauth`, request.url));
    }

    try {
        const profile = await fetchFortyTwoProfile(code);
        const user    = await findOrCreateUserFromFortyTwo(profile);
        await createSession(user.id, user.username, user.tokenVersion);
    } catch (err) {
        console.error("42 OAuth callback failed:", err);
        return NextResponse.redirect(new URL(`${ROUTES.home}?error=oauth`, request.url));
    }

    return NextResponse.redirect(new URL(ROUTES.home, request.url));
}
