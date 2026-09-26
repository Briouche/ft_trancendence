import { avatarMime, readAvatar } from "@/lib/avatarStorage";

/**
 * GET /api/avatars/:file — serves an uploaded avatar.
 *
 * The Content-Type comes from the server-generated extension, `nosniff` stops the browser from
 * second-guessing it, and the sandbox CSP makes the response inert even if opened directly: an
 * uploaded file is only ever displayed as an image.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const bytes = await readAvatar(file);
  if (!bytes) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": avatarMime(file),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // File names are unique per upload, so a given URL never changes content.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
