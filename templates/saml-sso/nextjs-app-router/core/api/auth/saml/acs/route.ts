import { NextRequest, NextResponse } from "next/server";

import { getOrCreateSamlUser } from "../../../../lib/auth-db";
import { validateSamlResponse } from "../../../../lib/saml-response";
import {
  getSessionCookieName,
  getSessionCookieOptions,
  createSessionToken,
} from "../../../../lib/session";

export const runtime = "nodejs";

const STATE_COOKIE_NAME = "saml_login_state";

function getAppUrl(): URL {
  const value = process.env.APP_URL;

  if (!value) {
    throw new Error("APP_URL is not configured.");
  }

  return new URL(value);
}

function redirectToLogin(error: string): NextResponse {
  const url = new URL("/login", getAppUrl());
  url.searchParams.set("error", error);

  const response = NextResponse.redirect(url, 303);
  response.cookies.delete(STATE_COOKIE_NAME);

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("application/x-www-form-urlencoded")) {
      return redirectToLogin("invalid_saml_request");
    }

    const formData = await request.formData();
    const samlResponse = formData.get("SAMLResponse");
    const returnedState = formData.get("RelayState");
    const storedState = request.cookies.get(STATE_COOKIE_NAME)?.value;

    if (
      typeof samlResponse !== "string" ||
      typeof returnedState !== "string" ||
      !storedState ||
      returnedState.length === 0 ||
      returnedState.length > 256 ||
      returnedState !== storedState
    ) {
      return redirectToLogin("invalid_saml_state");
    }

    const identity = await validateSamlResponse(samlResponse);

    const user = await getOrCreateSamlUser({
      idpIssuer: identity.idpIssuer,
      nameId: identity.nameId,
      nameIdFormat: identity.nameIdFormat,
      email: identity.email,
      name: identity.name,
    });

    const token = await createSessionToken(user);

    const response = NextResponse.redirect(
      new URL("/dashboard", getAppUrl()),
      303,
    );

    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      ...getSessionCookieOptions(),
    });

    response.cookies.delete(STATE_COOKIE_NAME);

    return response;
  } catch {
    return redirectToLogin("saml_verification_failed");
  }
}
