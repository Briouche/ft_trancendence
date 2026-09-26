import { z } from "zod";

// Validation schemas shared by the forms (client, for instant feedback) and the server actions /
// API routes (server, the check that actually counts). One schema per input, so the two sides
// can never disagree on what is valid.

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const EMAIL_MAX_LENGTH = 254;

/** Regex source for the HTML `pattern` attribute of username inputs. */
export const USERNAME_PATTERN = "^[a-zA-Z0-9_]+$";

const USERNAME_MESSAGE = `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters and contain only letters, numbers, and underscores.`;
const PASSWORD_MESSAGE = `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters long and include an uppercase letter, a lowercase letter, and a number.`;
const EMAIL_MESSAGE = "Please provide a valid email address.";

/** Username as stored: trimmed and lower-cased (usernames are case-insensitive). */
export const usernameSchema = z
  .string(USERNAME_MESSAGE)
  .trim()
  .min(USERNAME_MIN_LENGTH, USERNAME_MESSAGE)
  .max(USERNAME_MAX_LENGTH, USERNAME_MESSAGE)
  .regex(new RegExp(USERNAME_PATTERN), USERNAME_MESSAGE)
  .toLowerCase();

/** Email as stored: trimmed and lower-cased. */
export const emailSchema = z
  .string(EMAIL_MESSAGE)
  .trim()
  .toLowerCase()
  .max(EMAIL_MAX_LENGTH, EMAIL_MESSAGE)
  .pipe(z.email(EMAIL_MESSAGE));

/** New password: length bounds plus one lowercase, one uppercase and one digit. */
export const passwordSchema = z
  .string(PASSWORD_MESSAGE)
  .min(PASSWORD_MIN_LENGTH, PASSWORD_MESSAGE)
  .max(PASSWORD_MAX_LENGTH, PASSWORD_MESSAGE)
  .regex(/[a-z]/, PASSWORD_MESSAGE)
  .regex(/[A-Z]/, PASSWORD_MESSAGE)
  .regex(/\d/, PASSWORD_MESSAGE);

/**
 * Sign-in form. `identifier` is a username or an email address; the password is only
 * length-checked, since the rules for new passwords may have changed since it was set.
 */
export const loginSchema = z.object({
  identifier: z
    .string("Invalid username or password.")
    .trim()
    .min(1, "Username or email is required.")
    .max(EMAIL_MAX_LENGTH, "Invalid username or password.")
    .toLowerCase(),
  password: z
    .string("Password is required.")
    .min(1, "Password is required.")
    .max(PASSWORD_MAX_LENGTH, "Password is too long."),
});

/** Registration form. */
export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string("Passwords do not match."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/**
 * Profile edit form. An empty `password` means "keep the current one"; `currentPassword` is
 * required by the server action only when a new password is set on an account that has one.
 */
export const profileUpdateSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    currentPassword: z.string().max(PASSWORD_MAX_LENGTH).optional().default(""),
    password: z.union([z.literal(""), passwordSchema]).optional().default(""),
    confirmPassword: z.string().optional().default(""),
  })
  .refine((data) => data.password === "" || data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const DECK_NAME_MAX_LENGTH = 50;

/** Body of POST/PUT /api/decks (shape only; ownership and deck rules are checked in lib/decks.ts). */
export const deckBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, `Deck name must be 1-${DECK_NAME_MAX_LENGTH} characters`)
    .max(DECK_NAME_MAX_LENGTH, `Deck name must be 1-${DECK_NAME_MAX_LENGTH} characters`),
  cards: z
    .array(
      z.object({
        cardId: z.string().min(1).max(64),
        qty: z.number().int().positive().max(99),
      }),
      "Invalid card list",
    )
    .min(1, "Deck is empty")
    .max(100, "Too many card entries"),
});

/** A positive integer id from a route parameter or a JSON body. */
export const idSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

/** Direct chat message body. */
export const MESSAGE_MAX_LENGTH = 500;
export const messageContentSchema = z
  .string()
  .trim()
  .min(1, "Message is empty")
  .max(MESSAGE_MAX_LENGTH, `Messages are limited to ${MESSAGE_MAX_LENGTH} characters`);

/** String fields of a FormData, for parsing with one of the schemas above. */
export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}

/** First human-readable message of a failed parse, for display next to a form. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}
