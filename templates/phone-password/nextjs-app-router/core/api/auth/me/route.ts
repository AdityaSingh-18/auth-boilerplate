import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";

// Returns the currently authenticated user.
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Current user error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve current user." },
      { status: 500 },
    );
  }
}
