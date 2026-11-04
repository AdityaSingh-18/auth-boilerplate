import { NextRequest, NextResponse } from "next/server";
import { requestPhoneOtp } from "../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("phone" in body) ||
      typeof body.phone !== "string"
    ) {
      return NextResponse.json(
        { error: "A valid phone number is required." },
        { status: 400 },
      );
    }

    await requestPhoneOtp(body.phone);

    return NextResponse.json({
      message:
        "If the request is valid, a verification code will be sent.",
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_PHONE"
    ) {
      return NextResponse.json(
        { error: "Invalid phone number. Use E.164 format." },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "RATE_LIMITED"
    ) {
      return NextResponse.json(
        { error: "Too many OTP requests. Please try again later." },
        { status: 429 },
      );
    }

    console.error("SMS OTP request failed:", error);

    return NextResponse.json(
      { error: "Unable to send verification code." },
      { status: 500 },
    );
  }
}
