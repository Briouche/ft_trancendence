import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl } from "@/lib/oauth42";

export const STATE_COOKIE = "ft_oauth_state";

// Starts the 42 OAuth flow: stores an anti-CSRF state cookie and redirects to 42.
export async function GET() {
    const state = crypto.randomUUID();

    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE, state, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge:   5 * 60,
        path:     "/",
    });

    return NextResponse.redirect(buildAuthorizeUrl(state));
}
