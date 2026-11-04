import { NextRequest, NextResponse } from "next/server";

import { signInWithGoogle } from "../../../../lib/auth";

import {
  verifyOAuthState,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
} from "../../../../lib/oauth-state";

export const dynamic = "force-dynamic";

function getAppUrl(): string {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not configured.");
  }

  return appUrl.replace(/\/$/, "");
}

function clearOAuthCookies(response: NextResponse): void {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(
    OAUTH_STATE_COOKIE,
    "",
    cookieOptions,
  );

  response.cookies.set(
    OAUTH_VERIFIER_COOKIE,
    "",
    cookieOptions,
  );
}

function redirectToLogin(error: string): NextResponse {
  const response = NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent(error)}`,
      getAppUrl(),
    ),
  );

  clearOAuthCookies(response);

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const appUrl = getAppUrl();
    const searchParams = request.nextUrl.searchParams;

    const providerError = searchParams.get("error");

    if (providerError) {
      return redirectToLogin("google_sign_in_cancelled");
    }

    const code = searchParams.get("code");
    const receivedState = searchParams.get("state");

    const storedState = request.cookies.get(
      OAUTH_STATE_COOKIE,
    )?.value;

    const codeVerifier = request.cookies.get(
      OAUTH_VERIFIER_COOKIE,
    )?.value;

    if (
      !code ||
      !receivedState ||
      !storedState ||
      !codeVerifier
    ) {
      return redirectToLogin("invalid_oauth_response");
    }

    if (!verifyOAuthState(receivedState, storedState)) {
      return redirectToLogin("invalid_oauth_state");
    }

    await signInWithGoogle(code, codeVerifier);

    const response = NextResponse.redirect(
      new URL("/", appUrl),
    );

    clearOAuthCookies(response);

    return response;
  } catch (error) {
    console.error("Google OAuth callback failed:", error);

    return redirectToLogin("google_sign_in_failed");
  }
}
