import { NextRequest, NextResponse } from "next/server";
import { completeMagicLinkSignIn } from "../../../lib/auth";
import { createSession } from "../../../lib/session";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_or_expired_link", request.url));
  }

  try {
    const user = await completeMagicLinkSignIn(token);
    await createSession(user.id);

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Magic-link callback failed:", error);
    return NextResponse.redirect(new URL("/login?error=invalid_or_expired_link", request.url));
  }
}
