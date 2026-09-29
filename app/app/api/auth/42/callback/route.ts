import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
    EmailTakenError,
    fetchFortyTwoProfile,
    findOrCreateUserFromFortyTwo,
    getSiteOrigin,
    linkFortyTwoAccount,
} from "@/lib/auth/oauth42";
import { createSession, getSession } from "@/lib/auth/cookieSession";
import { ROUTES } from "@/config/routes";
import { LINK_COOKIE, STATE_COOKIE } from "../route";

/**
 * GET /api/auth/42/callback — where 42 sends the user back. Checks the anti-CSRF state, then
 * either signs the matching account in (creating it on first use) or, for a link attempt started
 * from the profile, links the 42 account to the signed-in user. Every failure lands on a page
 * that explains it (?error=… read by app/page.tsx or the profile), never on a raw error.
 */
export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    // Set by 42 when the user clicks "Cancel" on its authorization page.
    const providerError = url.searchParams.get("error");

    const cookieStore = await cookies();
    const expectedState = cookieStore.get(STATE_COOKIE)?.value;
    const isLink = cookieStore.get(LINK_COOKIE)?.value === "1";
    cookieStore.delete(STATE_COOKIE);
    cookieStore.delete(LINK_COOKIE);

    const siteOrigin = getSiteOrigin();
    const back = (path: string, query?: string) =>
        NextResponse.redirect(new URL(query ? `${path}?${query}` : path, siteOrigin));
    const failurePage = isLink ? ROUTES.profile : ROUTES.home;

    if (providerError) return back(failurePage, "error=oauth_denied");
    if (!code || !state || !expectedState || state !== expectedState) return back(failurePage, "error=oauth");

    try {
        const profile = await fetchFortyTwoProfile(code);

        if (isLink) {
            const session = await getSession();
            if (!session) return back(ROUTES.home, "error=oauth");
            const linked = await linkFortyTwoAccount(session.userId, profile.id);
            return linked ? back(ROUTES.profile, "linked=1") : back(ROUTES.profile, "error=oauth_42_taken");
        }

        const user = await findOrCreateUserFromFortyTwo(profile);
        await createSession(user.id, user.username, user.tokenVersion);
    } catch (err) {
        if (err instanceof EmailTakenError) return back(ROUTES.home, "error=oauth_email_taken");
        console.error("42 OAuth callback failed:", err);
        return back(failurePage, "error=oauth");
    }

    return back(ROUTES.home);
}
