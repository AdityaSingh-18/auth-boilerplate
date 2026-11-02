import { NextResponse } from "next/server";
import { loginUser } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
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

    const user = await loginUser({
      email: body.email,
      password: body.password,
    });

    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to log in.";
    const status = message === "Invalid email or password." ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}