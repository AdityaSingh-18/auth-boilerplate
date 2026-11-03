import { NextRequest, NextResponse } from "next/server";
import { verifyEmailOtp } from "../../../lib/auth";

interface VerifyOtpBody {
  email: string;
  otp: string;
}

export async function POST(request: NextRequest) {
  let body: VerifyOtpBody;

  try {
    const parsed: unknown = await request.json();

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("email" in parsed) ||
      typeof parsed.email !== "string" ||
      !("otp" in parsed) ||
      typeof parsed.otp !== "string"
    ) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 },
      );
    }

    body = {
      email: parsed.email,
      otp: parsed.otp,
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  try {
    const user = await verifyEmailOtp(body.email, body.otp);

    return NextResponse.json({
      message: "Successfully authenticated.",
      user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_CREATION_FAILED") {
      console.error("Email OTP user creation failed:", error);

      return NextResponse.json(
        { error: "Unable to complete authentication." },
        { status: 500 },
      );
    }

    if (error instanceof Error && error.message === "INVALID_OTP") {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 401 },
      );
    }

    console.error("Email OTP verification failed:", error);

    return NextResponse.json(
      { error: "Unable to verify the code." },
      { status: 500 },
    );
  }
}
