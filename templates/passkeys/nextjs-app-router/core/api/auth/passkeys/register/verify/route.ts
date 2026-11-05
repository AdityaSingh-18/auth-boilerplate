import { NextRequest, NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

import { getCurrentUser } from "../../../../../lib/auth";
import { verifyRegistration } from "../../../../../lib/passkey";

export const runtime = "nodejs";

function isRegistrationResponse(
  value: unknown,
): value is RegistrationResponseJSON {
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
    typeof data.attestationObject === "string"
  );
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    if (!isRegistrationResponse(body)) {
      return NextResponse.json(
        { error: "Invalid passkey registration response." },
        { status: 400 },
      );
    }

    const result = await verifyRegistration(user.id, body);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Passkey registration verification failed:", error);

    return NextResponse.json(
      { error: "Passkey registration failed." },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
