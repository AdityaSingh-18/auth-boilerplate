import { NextResponse } from "next/server";
import {
  createMicrosoftAuthorizationUrl,
} from "../../../lib/microsoft-oauth";
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthNonce,
  generateOAuthState,
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_CODE_VERIFIER_COOKIE,
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
} from "../../../lib/oauth-state";

export async function GET() {
  try {
    const state = generateOAuthState();
    const nonce = generateOAuthNonce();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const authorizationUrl = createMicrosoftAuthorizationUrl(
      state,
      nonce,
      codeChallenge
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
      cookieOptions
    );

    response.cookies.set(
      OAUTH_NONCE_COOKIE,
      nonce,
      cookieOptions
    );

    response.cookies.set(
      OAUTH_CODE_VERIFIER_COOKIE,
      codeVerifier,
      cookieOptions
    );

    return response;
  } catch (error) {
    console.error("Microsoft OAuth initialization failed:", error);

    const appUrl = process.env.APP_URL;

    if (!appUrl) {
      return NextResponse.json(
        { error: "Authentication configuration error." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      new URL("/login?error=microsoft_configuration_error", appUrl)
    );
  }
}
