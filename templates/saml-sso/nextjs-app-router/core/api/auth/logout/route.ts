import { NextResponse } from "next/server";

import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "../../../lib/session";

export const runtime = "nodejs";

function getAppUrl(): URL {
  const value = process.env.APP_URL;

  if (!value) {
    throw new Error("APP_URL is not configured.");
  }

  return new URL(value);
}

export async function POST() {
  const response = NextResponse.redirect(
    new URL("/login", getAppUrl()),
    303,
  );

  response.cookies.set({
    name: getSessionCookieName(),
    value: "",
    ...getSessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set({
    name: "saml_login_state",
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
