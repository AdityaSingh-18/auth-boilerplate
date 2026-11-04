import { NextResponse } from "next/server";
import { createGitHubAuthorizationUrl } from "../../../lib/github-oauth";
import {
  generateOAuthState,
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_STATE_COOKIE,
} from "../../../lib/oauth-state";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = generateOAuthState();
    const authorizationUrl = createGitHubAuthorizationUrl(state);

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_COOKIE_MAX_AGE,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to start GitHub authentication." },
      { status: 500 }
    );
  }
}
