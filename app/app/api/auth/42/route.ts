import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl } from "@/lib/auth/oauth42";

export const STATE_COOKIE = "ft_oauth_state";

// Entry point for the "Sign in with 42" flow: stash an anti-CSRF state in a short-lived
// cookie, then redirect to 42's authorization screen.
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
