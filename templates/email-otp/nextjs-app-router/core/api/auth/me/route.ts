import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Current user lookup failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve the current user." },
      { status: 500 },
    );
  }
}
