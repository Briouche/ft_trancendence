// Messages for the ?error=… / ?linked=1 values the 42 OAuth callback redirects with
// (app/api/auth/42/callback/route.ts). Client-safe: read by the sign-in page and the profile.

export const OAUTH_SIGN_IN_ERRORS: Record<string, string> = {
  oauth: "Sign in with 42 failed. Please try again.",
  oauth_denied: "Sign in with 42 was cancelled.",
  oauth_email_taken:
    "An account already uses your 42 email. Sign in with your password, then link 42 from your profile.",
};

export const OAUTH_LINK_MESSAGES: Record<string, string> = {
  linked: "Your 42 account is now linked: you can sign in with it.",
  oauth: "Linking your 42 account failed. Please try again.",
  oauth_denied: "Linking your 42 account was cancelled.",
  oauth_42_taken: "That 42 account is already linked to another player.",
};

/** Message for a page's ?error= (or ?linked=1) query value, if it is a known one. */
export function oauthMessage(
  messages: Record<string, string>,
  params: { error?: string | string[]; linked?: string | string[] },
): string | undefined {
  if (params.linked === "1") return messages.linked;
  return typeof params.error === "string" ? messages[params.error] : undefined;
}
