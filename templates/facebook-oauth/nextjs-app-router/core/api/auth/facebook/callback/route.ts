import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  verifyOAuthState,
} from "../../../../lib/oauth-state";
import { signInWithFacebook } from "../../../../lib/auth";

function getAppUrl(): URL {
  return new URL(process.env.APP_URL || "http://localhost:3000");
}

function redirectToLogin(error: string): NextResponse {
  const url = new URL("/login", getAppUrl());
  url.searchParams.set("error", error);

  const response = NextResponse.redirect(url);
  clearStateCookie(response);

  return response;
}

function clearStateCookie(response: NextResponse): void {
  response.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const providerError = searchParams.get("error");
  const code = searchParams.get("code");
  const receivedState = searchParams.get("state");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (providerError) {
    return redirectToLogin("facebook_sign_in_cancelled");
  }

  if (!code || !receivedState || !storedState) {
    return redirectToLogin("facebook_invalid_callback");
  }

  if (!verifyOAuthState(receivedState, storedState)) {
    return redirectToLogin("facebook_invalid_state");
  }

  try {
    await signInWithFacebook(code);

    const response = NextResponse.redirect(
      new URL("/", getAppUrl()),
    );

    clearStateCookie(response);

    return response;
  } catch {
    return redirectToLogin("facebook_sign_in_failed");
  }
}
