import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generateCodeChallenge,
  generateRandomValue,
  OAUTH_COOKIE_MAX_AGE,
  X_CODE_VERIFIER_COOKIE,
  X_STATE_COOKIE,
} from "../../../lib/oauth-state";
import { buildXAuthorizationUrl } from "../../../lib/x-oauth";

export async function GET() {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    return NextResponse.json(
      { error: "Missing APP_URL configuration." },
      { status: 500 }
    );
  }

  try {
    const state = generateRandomValue();
    const codeVerifier = generateRandomValue(64);
    const codeChallenge = generateCodeChallenge(codeVerifier);

    const authorizationUrl = buildXAuthorizationUrl(
      state,
      codeChallenge
    );

    const cookieStore = await cookies();

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: OAUTH_COOKIE_MAX_AGE,
    };

    cookieStore.set(X_STATE_COOKIE, state, cookieOptions);
    cookieStore.set(
      X_CODE_VERIFIER_COOKIE,
      codeVerifier,
      cookieOptions
    );

    return NextResponse.redirect(authorizationUrl);
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=x_configuration_error", appUrl)
    );
  }
}
