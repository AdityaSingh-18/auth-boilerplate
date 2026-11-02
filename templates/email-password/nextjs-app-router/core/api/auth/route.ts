import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "../../lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      typeof body !== "object" ||
      body === null ||
      !("email" in body) ||
      !("password" in body) ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const user = await registerUser({
      email: body.email,
      password: body.password,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Registration failed.";

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}
