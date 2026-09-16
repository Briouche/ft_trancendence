// lib/constants.ts

/** Matches the same argon2id parameters used to build {@link DUMMY_HASH}. */
export const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least 8 characters, one uppercase, one lowercase, one digit, and only
// characters from a safe allowlist (no brackets, quotes, backslashes, etc).
export const PASSWORD_ALLOWED_CHARS = "A-Za-z0-9!@#$%^&*_+\\-=.,?~";
export const PASSWORD_REGEX = new RegExp(
  `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[${PASSWORD_ALLOWED_CHARS}]{8,}$`
);

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
// Upper bound only - argon2 cost scales with input size, so an unbounded
// password lets someone send a multi-MB string and burn CPU/memory on every
// hash/verify call. 128 is generous for any real passphrase.
export const PASSWORD_MAX_LENGTH = 128;
export const EMAIL_MAX_LENGTH = 254; // RFC 5321 max mailbox length

export const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXJhbmRvbXNhbHQ$2rXwn8YSrN3W5uJmYh1IhrJfw5PZqPFqUJvXWkG1SVI";

// here because server files only accept async functions
export function getStringField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
