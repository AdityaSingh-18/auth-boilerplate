import { NextRequest, NextResponse } from "next/server";
import { signInWithGitHub } from "../../../../lib/auth";
import {
  OAUTH_STATE_COOKIE,
  verifyOAuthState,
} from "../../../../lib/oauth-state";

export const dynamic = "force-dynamic";

function getAppUrl(): string {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("APP_URL is not configured.");
  }

  return appUrl.replace(/\/+$/, "");
}

function redirectToLogin(error: string): NextResponse {
  const response = NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(error)}`, getAppUrl())
  );

  response.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const providerError = searchParams.get("error");

    if (providerError) {
      return redirectToLogin("github_authentication_denied");
    }

    const code = searchParams.get("code");
    const receivedState = searchParams.get("state");
    const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

    if (!code || !receivedState || !storedState) {
      return redirectToLogin("invalid_oauth_callback");
    }

    if (!verifyOAuthState(receivedState, storedState)) {
      return redirectToLogin("invalid_oauth_state");
    }

    await signInWithGitHub(code);

    const response = NextResponse.redirect(new URL("/", getAppUrl()));

    response.cookies.set(OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return redirectToLogin("github_sign_in_failed");
  }
}
