import { NextRequest, NextResponse } from "next/server";
import { requestEmailOtp } from "../../../lib/auth";

interface RequestOtpBody {
  email: string;
}

export async function POST(request: NextRequest) {
  let body: RequestOtpBody;

  try {
    const parsed: unknown = await request.json();

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("email" in parsed) ||
      typeof parsed.email !== "string"
    ) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 },
      );
    }

    body = parsed as RequestOtpBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: 400 },
    );
  }

  try {
    await requestEmailOtp(body.email);

    return NextResponse.json({
      message: "If the address can receive a verification code, an email will be sent.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_EMAIL") {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    console.error("Email OTP request failed:", error);

    return NextResponse.json(
      { error: "Unable to send a verification code." },
      { status: 500 },
    );
  }
}
