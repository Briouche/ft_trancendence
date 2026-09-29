import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildAuthorizeUrl } from "@/lib/auth/oauth42";
import { getSession } from "@/lib/auth/cookieSession";

/** Cookie holding the anti-CSRF `state` of an OAuth attempt in progress (5 minutes). */
export const STATE_COOKIE = "ft_oauth_state";
/** Set when the attempt links 42 to the signed-in account instead of signing in. */
export const LINK_COOKIE = "ft_oauth_link";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // every environment is served over HTTPS (proxy/)
  sameSite: "lax" as const, // must survive the top-level redirect back from 42
  maxAge: 5 * 60,
  path: "/",
};

/**
 * GET /api/auth/42 — starts "Sign in with 42": stores a random `state` in a cookie and redirects
 * to 42's authorize page. The callback only accepts a return whose `state` matches the cookie,
 * so another site can't complete a login flow in the user's browser (login CSRF).
 *
 * GET /api/auth/42?link=1 (while signed in) — same flow, but the callback links the 42 account
 * to the current account instead of signing in (from the profile page).
 */
export async function GET(request: Request) {
  const state = crypto.randomUUID();
  const wantsLink = new URL(request.url).searchParams.get("link") === "1";

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, COOKIE_OPTIONS);
  if (wantsLink && (await getSession())) cookieStore.set(LINK_COOKIE, "1", COOKIE_OPTIONS);
  else cookieStore.delete(LINK_COOKIE);

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
