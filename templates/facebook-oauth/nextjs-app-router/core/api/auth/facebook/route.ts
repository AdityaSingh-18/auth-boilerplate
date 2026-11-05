import { NextResponse } from "next/server";
import {
  generateOAuthState,
  OAUTH_COOKIE_MAX_AGE,
  OAUTH_STATE_COOKIE,
} from "../../../lib/oauth-state";

export async function GET() {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
    const graphApiVersion =
      process.env.FACEBOOK_GRAPH_API_VERSION || "v26.0";

    if (!appId || !redirectUri) {
      throw new Error("Facebook OAuth environment variables are missing.");
    }

    const state = generateOAuthState();

    const authorizationUrl = new URL(
      `https://www.facebook.com/${graphApiVersion}/dialog/oauth`,
    );

    authorizationUrl.searchParams.set("client_id", appId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("state", state);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "public_profile,email");

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: OAUTH_COOKIE_MAX_AGE,
    });

    return response;
  } catch {
    const appUrl = process.env.APP_URL || "http://localhost:3000";

    return NextResponse.redirect(
      new URL("/login?error=facebook_configuration_error", appUrl),
    );
  }
}