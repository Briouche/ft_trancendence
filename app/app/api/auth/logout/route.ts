import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearAuthCookie();
  } catch {
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
