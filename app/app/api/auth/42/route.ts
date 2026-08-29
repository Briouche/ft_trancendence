import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl } from "@/lib/oauth42";

export const STATE_COOKIE = "ft_oauth_state";

// Point de départ du flow "Sign in with 42" : un state anti-CSRF est posé dans un cookie
// court, puis on redirige vers l'écran d'autorisation de 42.
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
