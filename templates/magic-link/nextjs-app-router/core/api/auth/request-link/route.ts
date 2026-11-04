import { NextRequest, NextResponse } from "next/server";
import { requestMagicLink } from "../../../lib/auth";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("email" in body) || typeof body.email !== "string") {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  try {
    await requestMagicLink(body.email);
    return NextResponse.json({
      message: "If the address is valid, a sign-in link has been sent.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EMAIL") {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    console.error("Magic-link request failed:", error);
    return NextResponse.json({ error: "Unable to send sign-in link." }, { status: 500 });
  }
}
