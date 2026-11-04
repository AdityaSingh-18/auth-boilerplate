import { NextResponse } from "next/server";
import { createAppleAuthorizationUrl } from "../../../lib/apple-oauth";
import {
  generateOAuthNonce,
  generateOAuthState,
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
} from "../../../lib/oauth-state";

function getAppUrl(): string {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("Missing APP_URL.");
  }

  return appUrl;
}

export async function GET() {
  try {
    const state = generateOAuthState();
    const nonce = generateOAuthNonce();

    const authorizationUrl = createAppleAuthorizationUrl(
      state,
      nonce
    );

    const response = NextResponse.redirect(authorizationUrl);

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
      path: "/",
      maxAge: OAUTH_COOKIE_MAX_AGE,
    };

    response.cookies.set(OAUTH_STATE_COOKIE, state, cookieOptions);
    response.cookies.set(OAUTH_NONCE_COOKIE, nonce, cookieOptions);

    return response;
  } catch (error) {
    console.error("Apple sign-in initialization failed:", error);

    try {
      return NextResponse.redirect(
        new URL("/login?error=apple_configuration_error", getAppUrl())
      );
    } catch {
      return NextResponse.json(
        { error: "Apple sign-in configuration error." },
        { status: 500 }
      );
    }
  }
}
