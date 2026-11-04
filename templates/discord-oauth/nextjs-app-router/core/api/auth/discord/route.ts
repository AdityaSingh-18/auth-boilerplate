import { NextResponse } from "next/server";
import { createDiscordAuthorizationUrl } from "../../../lib/discord-oauth";
import {
  generateOAuthState,
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_MAX_AGE,
} from "../../../lib/oauth-state";

export async function GET(): Promise<NextResponse> {
  try {
    const state = generateOAuthState();
    const authorizationUrl = createDiscordAuthorizationUrl(state);

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_STATE_MAX_AGE,
    });

    return response;
  } catch {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";

    return NextResponse.redirect(
      new URL("/login?error=discord_configuration_error", appUrl),
    );
  }
}