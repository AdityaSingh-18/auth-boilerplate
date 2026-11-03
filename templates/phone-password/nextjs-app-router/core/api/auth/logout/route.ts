import { NextResponse } from "next/server";
import { deleteSession } from "../../../lib/session";

// Logs out the current user by clearing the session cookie.
export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json({
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { error: "Unable to log out." },
      { status: 500 },
    );
  }
}
