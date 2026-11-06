import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { startOidcSignIn } from "../../../../lib/auth";
import { createOidcAuthorizationState } from "../../../../lib/oidc-state";

export const runtime = "nodejs";

const FLOW_COOKIE_MAX_AGE = 10 * 60;

const FLOW_COOKIES = {
  state: "oidc_state",
  nonce: "oidc_nonce",
  verifier: "oidc_code_verifier",
  tenant: "oidc_tenant_id",
};

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("email" in body) ||
      typeof body.email !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "A valid email address is required" },
        { status: 400 },
      );
    }

    const authorizationState = createOidcAuthorizationState();

    const result = await startOidcSignIn(
      body.email,
      authorizationState.state,
      authorizationState.nonce,
      authorizationState.codeChallenge,
    );

    const cookieStore = await cookies();

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: FLOW_COOKIE_MAX_AGE,
    };

    cookieStore.set(
      FLOW_COOKIES.state,
      authorizationState.state,
      cookieOptions,
    );

    cookieStore.set(
      FLOW_COOKIES.nonce,
      authorizationState.nonce,
      cookieOptions,
    );

    cookieStore.set(
      FLOW_COOKIES.verifier,
      authorizationState.codeVerifier,
      cookieOptions,
    );

    cookieStore.set(
      FLOW_COOKIES.tenant,
      result.tenant.id,
      cookieOptions,
    );

    return NextResponse.json({
      success: true,
      authorizationUrl: result.authorizationUrl,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to start single sign-on",
      },
      { status: 400 },
    );
  }
}
