import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated." },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Unable to retrieve the current user." },
      { status: 500 }
    );
  }
}
