import { NextResponse } from "next/server";
import { createAuthenticationOptions } from "../../../../../lib/passkey";

export const runtime = "nodejs";

export async function POST() {
  try {
    const options = await createAuthenticationOptions();

    return NextResponse.json(options, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Passkey authentication options failed:", error);

    return NextResponse.json(
      { error: "Could not start sign-in." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
