import { NextRequest, NextResponse } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

import { verifyAuthentication } from "../../../../../lib/passkey";
import { signInWithPasskey } from "../../../../../lib/auth";

export const runtime = "nodejs";

function isAuthenticationResponse(
  value: unknown,
): value is AuthenticationResponseJSON {
  if (!value || typeof value !== "object") return false;

  const body = value as Record<string, unknown>;
  const response = body.response;

  if (!response || typeof response !== "object") return false;

  const data = response as Record<string, unknown>;

  return (
    typeof body.id === "string" &&
    typeof body.rawId === "string" &&
    body.type === "public-key" &&
    typeof data.clientDataJSON === "string" &&
    typeof data.authenticatorData === "string" &&
    typeof data.signature === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!isAuthenticationResponse(body)) {
      return NextResponse.json(
        { error: "Invalid passkey authentication response." },
        { status: 400 },
      );
    }

    const result = await verifyAuthentication(body);

    await signInWithPasskey(result.userId);

    return NextResponse.json(
      { verified: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Passkey authentication failed:", error);

    return NextResponse.json(
      { error: "Passkey sign-in failed." },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
