import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { completeOidcSignIn } from "../../../../lib/auth";
import { verifyOidcState } from "../../../../lib/oidc-state";

export const runtime = "nodejs";

const FLOW_COOKIES = [
  "oidc_state",
  "oidc_nonce",
  "oidc_code_verifier",
  "oidc_tenant_id",
] as const;

function getAppUrl(): URL {
  const value = process.env.APP_URL;

  if (!value) {
    throw new Error("APP_URL is not configured");
  }

  const url = new URL(value);

  if (
    url.protocol !== "https:" &&
    !(url.protocol === "http:" && url.hostname === "localhost")
  ) {
    throw new Error("APP_URL must use HTTPS outside local development");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error("APP_URL is invalid");
  }

  return url;
}

function loginRedirect(error?: string): NextResponse {
  const url = new URL("/login", getAppUrl());

  if (error) {
    url.searchParams.set("error", error);
  }

  return NextResponse.redirect(url, 303);
}

function clearFlowCookies(response: NextResponse): NextResponse {
  for (const name of FLOW_COOKIES) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const url = new URL(request.url);

  const receivedState = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const providerError = url.searchParams.get("error");

  const expectedState = cookieStore.get("oidc_state")?.value;
  const nonce = cookieStore.get("oidc_nonce")?.value;
  const codeVerifier = cookieStore.get("oidc_code_verifier")?.value;
  const tenantId = cookieStore.get("oidc_tenant_id")?.value;

  if (providerError) {
    return clearFlowCookies(
      loginRedirect("identity_provider_error"),
    );
  }

  if (
    !receivedState ||
    !expectedState ||
    !verifyOidcState(receivedState, expectedState) ||
    !nonce ||
    !codeVerifier ||
    !tenantId ||
    !code
  ) {
    return clearFlowCookies(
      loginRedirect("invalid_oidc_callback"),
    );
  }

  try {
    await completeOidcSignIn({
      code,
      codeVerifier,
      nonce,
      tenantId,
    });

    return clearFlowCookies(loginRedirect());
  } catch {
    return clearFlowCookies(
      loginRedirect("oidc_sign_in_failed"),
    );
  }
}
