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

/** Largest value of a PostgreSQL `integer` column (every id in the schema is one). */
export const MAX_DB_ID = 2_147_483_647;

/**
 * Positive integer id, from a number or a route/query string ("12"). Capped at MAX_DB_ID: a larger
 * value would make Prisma throw "value out of range" instead of simply finding nothing.
 */
export const idSchema = z.coerce.number().int().positive().max(MAX_DB_ID);

export const DECK_NAME_MAX_LENGTH = 40;

/** Body of POST/PUT /api/decks. Ownership and deck-building rules are checked in lib/decks.ts. */
export const deckBodySchema = z.object({
  name: z.string().trim().min(1, "Give your deck a name.").max(DECK_NAME_MAX_LENGTH, `Deck name is ${DECK_NAME_MAX_LENGTH} characters max.`),
  cards: z
    .array(z.object({ cardId: z.string().min(1).max(64), qty: z.number().int().min(1).max(30) }))
    .min(1, "Add cards to your deck.")
    .max(100),
});

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
