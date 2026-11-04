import { NextRequest, NextResponse } from "next/server";
import { verifyPhoneOtp } from "../../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("phone" in body) ||
      typeof body.phone !== "string" ||
      !("otp" in body) ||
      typeof body.otp !== "string"
    ) {
      return NextResponse.json(
        {
          error: "A phone number and verification code are required.",
        },
        { status: 400 },
      );
    }

    const user = await verifyPhoneOtp(
      body.phone,
      body.otp,
    );

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "RATE_LIMITED"
    ) {
      return NextResponse.json(
        {
          error: "Too many verification attempts. Please try again later.",
        },
        { status: 429 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_OTP"
    ) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 401 },
      );
    }

    console.error("SMS OTP verification failed:", error);

    return NextResponse.json(
      { error: "Unable to verify the code." },
      { status: 500 },
    );
  }
}
