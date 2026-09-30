import { z } from "zod";
import {
  EMAIL_MAX_LENGTH,
  EMAIL_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
} from "@/lib/auth/requirements";
import { MESSAGE_MAX_LENGTH } from "@/lib/user-and-friends/requirements";

// Input schemas shared by the browser (early feedback in the forms) and the server (the actual
// enforcement in server actions and route handlers). Client-safe: no server-only imports here.

export const USERNAME_RULE = `${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} letters or digits`;
export const PASSWORD_RULE =
  "8-128 characters with an uppercase letter, a lowercase letter and a digit, " +
  "using only letters, digits and !@#$%^&*_+-=.,?~";

/** Usernames are stored lower-cased, so every lookup goes through this. */
export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH, `Username must be ${USERNAME_RULE}.`)
  .max(USERNAME_MAX_LENGTH, `Username must be ${USERNAME_RULE}.`)
  .regex(USERNAME_REGEX, `Username must be ${USERNAME_RULE}.`)
  .transform((s) => s.toLowerCase());

/** Emails are stored lower-cased too, so "A@x.io" and "a@x.io" are one account. */
export const emailSchema = z
  .string()
  .trim()
  .max(EMAIL_MAX_LENGTH, "Please provide a valid email address.")
  .regex(EMAIL_REGEX, "Please provide a valid email address.")
  .transform((s) => s.toLowerCase());

export const passwordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH, `Password must be ${PASSWORD_RULE}.`)
  .regex(PASSWORD_REGEX, `Password must be ${PASSWORD_RULE}.`);

/**
 * Sign-in form: an email or a username, and a password. Only the length is checked on the
 * password here: the stored hash decides, and a failed login must not reveal which rule failed.
 */
export const signInSchema = z.object({
  identifier: z.string().trim().min(1).max(EMAIL_MAX_LENGTH),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/** Positive integer id, from a number or a route/query string ("12"). */
export const idSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const DECK_NAME_MAX_LENGTH = 40;

/** Body of POST/PUT /api/decks. Ownership and deck-building rules are checked in lib/decks.ts. */
export const deckBodySchema = z.object({
  name: z.string().trim().min(1, "Give your deck a name.").max(DECK_NAME_MAX_LENGTH, `Deck name is ${DECK_NAME_MAX_LENGTH} characters max.`),
  cards: z
    .array(z.object({ cardId: z.string().min(1).max(64), qty: z.number().int().min(1).max(30) }))
    .min(1, "Add cards to your deck.")
    .max(100),
});

export const messageSchema = z
  .string()
  .trim()
  .min(1, "Message is empty.")
  .max(MESSAGE_MAX_LENGTH, `Messages are ${MESSAGE_MAX_LENGTH} characters max.`);

export const USER_SORTS = ["elo", "username", "wins", "createdAt"] as const;
export const USER_PAGE_SIZES = [10, 20, 50] as const;

/**
 * Query string of the player search (GET /api/users). Every field is optional and falls back to
 * a default, so a hand-edited URL never errors: it just gets the default list.
 */
export const userSearchSchema = z.object({
  q: z.string().trim().max(USERNAME_MAX_LENGTH).catch(""),
  online: z.enum(["all", "online"]).catch("all"),
  minElo: z.coerce.number().int().min(0).max(5000).catch(0),
  sort: z.enum(USER_SORTS).catch("elo"),
  order: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
  pageSize: z.coerce
    .number()
    .refine((n): n is (typeof USER_PAGE_SIZES)[number] => (USER_PAGE_SIZES as readonly number[]).includes(n))
    .catch(20),
});
export type UserSearchParams = z.infer<typeof userSearchSchema>;

/** First human-readable message of a failed parse, for a form's error line. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

/** Plain object of a FormData's string fields (files are skipped), ready for a schema. */
export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string") out[key] = value;
  return out;
}
