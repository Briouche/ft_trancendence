import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { jsonError, requireSession } from "@/lib/api";
import { avatarUrl } from "@/lib/avatar";
import { AVATAR_MAX_BYTES, deleteAvatar, detectImageFormat, saveAvatar } from "@/lib/avatarStorage";
import { rateLimit } from "@/lib/rateLimit";

/**
 * POST /api/user/avatar (multipart/form-data, field "avatar") — replaces the current user's
 * avatar. PNG, JPEG or WebP, 2 MB max, checked on the actual bytes.
 */
export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  // Cheap early refusal before reading the body; the real size check is on the bytes below.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > AVATAR_MAX_BYTES + 64 * 1024) return jsonError(413, "Avatar must be 2 MB or less.");

  if (!rateLimit(`avatar:${auth.userId}`, { max: 10, windowMs: 60 * 60 * 1000 })) {
    return jsonError(429, "Too many avatar changes, try again later.");
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("avatar");
  if (!(file instanceof File) || file.size === 0) return jsonError(400, "No image received.");
  if (file.size > AVATAR_MAX_BYTES) return jsonError(413, "Avatar must be 2 MB or less.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const format = detectImageFormat(bytes);
  if (!format) return jsonError(415, "Only PNG, JPEG and WebP images are accepted.");

  const name = await saveAvatar(auth.userId, bytes, format);
  const previous = await prisma.user.findUnique({ where: { id: auth.userId }, select: { avatar: true } });
  await prisma.user.update({ where: { id: auth.userId }, data: { avatar: name } });
  await deleteAvatar(previous?.avatar ?? null);

  revalidatePath("/profile");
  return NextResponse.json({ avatarUrl: avatarUrl(name) });
}

/** DELETE /api/user/avatar — goes back to the default avatar. */
export async function DELETE() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const previous = await prisma.user.findUnique({ where: { id: auth.userId }, select: { avatar: true } });
  await prisma.user.update({ where: { id: auth.userId }, data: { avatar: null } });
  await deleteAvatar(previous?.avatar ?? null);

  revalidatePath("/profile");
  return NextResponse.json({ avatarUrl: avatarUrl(null) });
}
