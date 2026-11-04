import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get current user failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve the current user." },
      { status: 500 },
    );
  }
}
