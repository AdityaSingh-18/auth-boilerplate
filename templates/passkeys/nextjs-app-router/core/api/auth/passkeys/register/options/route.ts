import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";
import { createRegistrationOptions } from "../../../../../lib/passkey";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    return NextResponse.json(await createRegistrationOptions(user), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Passkey registration options failed:", error);
    return NextResponse.json({ error: "Could not start registration." }, { status: 500 });
  }
}
