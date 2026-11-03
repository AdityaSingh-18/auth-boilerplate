import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "../../../lib/auth";

// Registers a new user with a phone number and password.
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

    const user = await registerUser(phone, password);

    return NextResponse.json(
      {
        message: "Registration successful.",
        user,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      if (error.message === "INVALID_PHONE_NUMBER") {
        return NextResponse.json(
          { error: "Please provide a valid international phone number." },
          { status: 400 },
        );
      }

      if (error.message === "INVALID_PASSWORD") {
        return NextResponse.json(
          { error: "Password must be between 8 and 128 characters." },
          { status: 400 },
        );
      }

      if (error.message === "USER_ALREADY_EXISTS") {
        return NextResponse.json(
          { error: "An account with this phone number already exists." },
          { status: 409 },
        );
      }
    }

    console.error("Registration error:", error);

    return NextResponse.json(
      { error: "Unable to register user." },
      { status: 500 },
    );
  }
}
