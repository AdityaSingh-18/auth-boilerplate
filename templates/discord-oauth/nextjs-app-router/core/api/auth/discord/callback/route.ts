import { NextRequest, NextResponse } from "next/server";
import { signInWithDiscord } from "../../../../lib/auth";
import {
  OAUTH_STATE_COOKIE,
  verifyOAuthState,
} from "../../../../lib/oauth-state";

function loginErrorRedirect(): NextResponse {
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  return NextResponse.redirect(
    new URL("/login?error=discord_sign_in_failed", appUrl),
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  const providerError = searchParams.get("error");
  const code = searchParams.get("code");
  const receivedState = searchParams.get("state");
  const storedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (
    providerError ||
    !code ||
    !receivedState ||
    !storedState ||
    !verifyOAuthState(receivedState, storedState)
  ) {
    const response = loginErrorRedirect();
    response.cookies.delete(OAUTH_STATE_COOKIE);

    return response;
  }

  try {
    await signInWithDiscord(code);

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const response = NextResponse.redirect(new URL("/", appUrl));

    response.cookies.delete(OAUTH_STATE_COOKIE);

    return response;
  } catch {
    const response = loginErrorRedirect();
    response.cookies.delete(OAUTH_STATE_COOKIE);

    return response;
  }
}