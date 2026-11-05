import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  isValidOAuthState,
  X_CODE_VERIFIER_COOKIE,
  X_STATE_COOKIE,
} from "../../../../lib/oauth-state";
import { signInWithX } from "../../../../lib/auth";

function getAppUrl(): string {
  const value = process.env.APP_URL;

  if (!value) {
    throw new Error("Missing APP_URL environment variable.");
  }

  return value;
}

function loginRedirect(error: string): NextResponse {
  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent(error)}`,
      getAppUrl()
    )
  );
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  const storedState = cookieStore.get(X_STATE_COOKIE)?.value;
  const codeVerifier = cookieStore.get(
    X_CODE_VERIFIER_COOKIE
  )?.value;

  const clearOAuthCookies = () => {
    cookieStore.set(X_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    cookieStore.set(X_CODE_VERIFIER_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  };

  try {
    const providerError = request.nextUrl.searchParams.get("error");

    if (providerError) {
      clearOAuthCookies();
      return loginRedirect("x_authorization_denied");
    }

    const code = request.nextUrl.searchParams.get("code");
    const receivedState = request.nextUrl.searchParams.get("state");

    if (
      !code ||
      !receivedState ||
      !storedState ||
      !codeVerifier ||
      !isValidOAuthState(receivedState, storedState)
    ) {
      clearOAuthCookies();
      return loginRedirect("invalid_x_oauth_state");
    }

    clearOAuthCookies();

    await signInWithX(code, codeVerifier);

    return NextResponse.redirect(new URL("/", getAppUrl()));
  } catch {
    clearOAuthCookies();
    return loginRedirect("x_authentication_failed");
  }
}
