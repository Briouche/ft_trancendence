// Avatar URLs, usable from both server and client code.

/** Image shown for users who never uploaded an avatar. */
export const DEFAULT_AVATAR_URL = "/avatars/default.svg";

/** Public URL of a stored avatar file name (User.avatar), or the default avatar. */
export function avatarUrl(avatar: string | null | undefined): string {
  return avatar ? `/api/avatars/${avatar}` : DEFAULT_AVATAR_URL;
}
