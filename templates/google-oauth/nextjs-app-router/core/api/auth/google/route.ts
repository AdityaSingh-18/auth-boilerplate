import { NextResponse } from "next/server";

import {
  createGoogleAuthorizationUrl,
} from "../../../lib/google-oauth";

import {
  generateOAuthState,
  generateCodeVerifier,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  OAUTH_COOKIE_MAX_AGE,
} from "../../../lib/oauth-state";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = generateOAuthState();
    const codeVerifier = generateCodeVerifier();

    const authorizationUrl = createGoogleAuthorizationUrl(
      state,
      codeVerifier,
    );

    const response = NextResponse.redirect(authorizationUrl);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: OAUTH_COOKIE_MAX_AGE,
    };

    response.cookies.set(
      OAUTH_STATE_COOKIE,
      state,
      cookieOptions,
    );

    response.cookies.set(
      OAUTH_VERIFIER_COOKIE,
      codeVerifier,
      cookieOptions,
    );

    return response;
  } catch (error) {
    console.error("Google OAuth initialization failed:", error);

    return NextResponse.json(
      { error: "Unable to start Google sign-in." },
      { status: 500 },
    );
  }
}
