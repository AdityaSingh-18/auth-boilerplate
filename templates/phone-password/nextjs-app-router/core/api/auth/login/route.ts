import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "../../../lib/auth";

// Authenticates a user with their phone number and password.
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const { phone, password } = body as {
      phone?: unknown;
      password?: unknown;
    };

    if (
      typeof phone !== "string" ||
      typeof password !== "string" ||
      !phone.trim() ||
      !password
    ) {
      return NextResponse.json(
        { error: "Phone number and password are required." },
        { status: 400 },
      );
    }

    const user = await loginUser(phone, password);

    return NextResponse.json({
      message: "Login successful.",
      user,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (
        error.message === "INVALID_PHONE_NUMBER" ||
        error.message === "INVALID_CREDENTIALS"
      ) {
        return NextResponse.json(
          { error: "Invalid phone number or password." },
          { status: 401 },
        );
      }
    }

    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Unable to log in." },
      { status: 500 },
    );
  }
}
