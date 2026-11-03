import { NextResponse } from "next/server";
import { registerUser } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("username" in body) ||
      !("password" in body) ||
      typeof body.username !== "string" ||
      typeof body.password !== "string"
    ) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 },
      );
    }

    const user = await registerUser({
      username: body.username,
      password: body.password,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register.";

    const status = message === "USER_ALREADY_EXISTS" ? 409 : 400;

    const responseMessage =
      message === "USER_ALREADY_EXISTS"
        ? "This username is already taken."
        : message;

    return NextResponse.json(
      { error: responseMessage },
      { status },
    );
  }
}
