import { NextResponse } from "next/server";
import { getSession } from "../../../lib/session";

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Microsoft session lookup failed:", error);

    return NextResponse.json(
      { error: "Unable to retrieve session." },
      { status: 500 }
    );
  }
}
