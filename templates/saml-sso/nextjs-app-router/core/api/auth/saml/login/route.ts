import { randomBytes } from "node:crypto";

import { NextResponse } from "next/server";

import { getSamlClient } from "../../../../lib/saml-config";

export const runtime = "nodejs";

const STATE_COOKIE_NAME = "saml_login_state";
const STATE_MAX_AGE_SECONDS = 10 * 60;

function getAppUrl(): URL {
  const value = process.env.APP_URL;

  if (!value) {
    throw new Error("APP_URL is not configured.");
  }

  return new URL(value);
}

export async function GET() {
  try {
    const state = randomBytes(32).toString("base64url");
    const saml = getSamlClient();

    // Node-SAML 5.2.0 expects AuthOptions as the second argument.
    const authorizationUrl = await saml.getAuthorizeUrlAsync(
      state,
      {},
    );

    const response = NextResponse.redirect(authorizationUrl);

    response.cookies.set({
      name: STATE_COOKIE_NAME,
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
      maxAge: STATE_MAX_AGE_SECONDS,
    });

    return response;
  } catch {
    const url = new URL("/login", getAppUrl());
    url.searchParams.set("error", "saml_login_failed");

    return NextResponse.redirect(url);
  }
}
