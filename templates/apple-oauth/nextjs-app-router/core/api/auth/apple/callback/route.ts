import { NextRequest, NextResponse } from "next/server";
import { signInWithApple } from "../../../../lib/auth";
import {
  OAUTH_NONCE_COOKIE,
  OAUTH_STATE_COOKIE,
  verifyOAuthState,
} from "../../../../lib/oauth-state";

function getAppUrl(): string {
  const appUrl = process.env.APP_URL;

  if (!appUrl) {
    throw new Error("Missing APP_URL.");
  }

  return appUrl;
}

function redirectToLogin(error: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/login?error=${encodeURIComponent(error)}`, getAppUrl())
  );
}

function clearOAuthCookies(response: NextResponse): NextResponse {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "none" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(OAUTH_STATE_COOKIE, "", cookieOptions);
  response.cookies.set(OAUTH_NONCE_COOKIE, "", cookieOptions);

  return response;
}

function getAppleUserName(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (typeof parsed !== "object" || parsed === null || !("name" in parsed)) {
      return null;
    }

    const name = parsed.name;

    if (typeof name !== "object" || name === null) {
      return null;
    }

    const firstName =
      "firstName" in name && typeof name.firstName === "string"
        ? name.firstName.trim()
        : "";

    const lastName =
      "lastName" in name && typeof name.lastName === "string"
        ? name.lastName.trim()
        : "";

    const fullName = [firstName, lastName].filter(Boolean).join(" ");

    return fullName || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let redirectResponse: NextResponse;

  try {
    const formData = await request.formData();

    const code = formData.get("code");
    const state = formData.get("state");
    const providerError = formData.get("error");

    const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
    const storedNonce = request.cookies.get(OAUTH_NONCE_COOKIE)?.value;

    if (typeof providerError === "string" && providerError) {
      redirectResponse = redirectToLogin("apple_sign_in_cancelled");
      return clearOAuthCookies(redirectResponse);
    }

    if (
      typeof code !== "string" ||
      typeof state !== "string" ||
      !storedState ||
      !storedNonce ||
      !verifyOAuthState(state, storedState)
    ) {
      redirectResponse = redirectToLogin("apple_sign_in_failed");
      return clearOAuthCookies(redirectResponse);
    }

    const name = getAppleUserName(formData.get("user"));

    await signInWithApple(code, storedNonce, name);

    redirectResponse = NextResponse.redirect(new URL("/", getAppUrl()));

    return clearOAuthCookies(redirectResponse);
  } catch (error) {
    console.error("Apple sign-in callback failed:", error);

    try {
      redirectResponse = redirectToLogin("apple_sign_in_failed");
      return clearOAuthCookies(redirectResponse);
    } catch {
      return NextResponse.json(
        { error: "Apple sign-in failed." },
        { status: 500 }
      );
    }
  }
}
