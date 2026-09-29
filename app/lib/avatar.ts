// Avatar URLs, usable from both server and client code.

/** Image shown for users who never uploaded an avatar. */
export const DEFAULT_AVATAR_URL = "/avatars/default.svg";

/**
 * Displayable URL of User.avatar, or the default avatar. The profile form stores a data URI
 * (lib/user-and-friends/updateUserProfile.ts); older rows may still hold a file name served by
 * /api/avatars/[file].
 */
export function avatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return DEFAULT_AVATAR_URL;
  return avatar.startsWith("data:") ? avatar : `/api/avatars/${avatar}`;
}
