import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchFortyTwoProfile, findOrCreateUserFromFortyTwo } from "@/lib/oauth42";
import { createSession } from "@/lib/session";
import { ROUTES } from "@/config/routes";
import { STATE_COOKIE } from "../route";

// Retour de 42 après autorisation : vérifie le state posé au départ, échange le code contre
// un profil 42, retrouve/crée le compte local, puis ouvre la même session que le login
// email+mot de passe (createSession) — le reste de l'appli n'a rien à savoir de plus.
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
