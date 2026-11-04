import { NextRequest, NextResponse } from "next/server";
import { signInWithMicrosoft } from "../../../../lib/auth";
import {
  OAUTH_CODE_VERIFIER_COOKIE,
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
  verifyOAuthState,
} from "../../../../lib/oauth-state";

function getAppUrl(): string {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("Missing APP_URL environment variable.");
  }

  return appUrl;
}

function clearOAuthCookies(response: NextResponse): void {
  const cookieNames = [
    OAUTH_STATE_COOKIE,
    OAUTH_NONCE_COOKIE,
    OAUTH_CODE_VERIFIER_COOKIE,
  ];

  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}

function redirectToLogin(error: string): NextResponse {
  const url = new URL("/login", getAppUrl());
  url.searchParams.set("error", error);

  const response = NextResponse.redirect(url);
  clearOAuthCookies(response);

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const providerError = searchParams.get("error");
    const code = searchParams.get("code");
    const receivedState = searchParams.get("state");

    const storedState = request.cookies.get(
      OAUTH_STATE_COOKIE
    )?.value;

    const nonce = request.cookies.get(
      OAUTH_NONCE_COOKIE
    )?.value;

    const codeVerifier = request.cookies.get(
      OAUTH_CODE_VERIFIER_COOKIE
    )?.value;

    if (providerError) {
      return redirectToLogin("microsoft_sign_in_failed");
    }

    if (
      !code ||
      !receivedState ||
      !storedState ||
      !nonce ||
      !codeVerifier ||
      !verifyOAuthState(receivedState, storedState)
    ) {
      return redirectToLogin("microsoft_sign_in_failed");
    }

    await signInWithMicrosoft(
      code,
      codeVerifier,
      nonce
    );

    const response = NextResponse.redirect(
      new URL("/", getAppUrl())
    );

    clearOAuthCookies(response);

    return response;
  } catch (error) {
    console.error("Microsoft OAuth callback failed:", error);

    return redirectToLogin("microsoft_sign_in_failed");
  }
}
