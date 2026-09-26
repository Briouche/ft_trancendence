import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";
import { getSession } from "@/lib/session";
import { firstIssue } from "@/lib/validation";

// Small helpers shared by the route handlers in app/api, so every route answers errors the same
// way: `{ error: string }` with the matching HTTP status.

/** JSON error response. */
export function jsonError(status: number, error: string): NextResponse {
  return NextResponse.json({ error }, { status });
}

type SessionPayload = NonNullable<Awaited<ReturnType<typeof getSession>>>;

/**
 * The current session, or a ready-made 401 response. Usage:
 * `const auth = await requireSession(); if (auth instanceof NextResponse) return auth;`
 */
export async function requireSession(): Promise<SessionPayload | NextResponse> {
  const session = await getSession();
  return session ?? jsonError(401, "Unauthorized");
}

/**
 * Parses a JSON request body with a zod schema. Returns the data, or a 400 response carrying the
 * first validation message (an unparsable body counts as invalid, not as a server error).
 */
export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T> | NextResponse> {
  const body = await request.json().catch(() => undefined);
  const parsed = schema.safeParse(body);
  return parsed.success ? parsed.data : jsonError(400, firstIssue(parsed.error));
}
