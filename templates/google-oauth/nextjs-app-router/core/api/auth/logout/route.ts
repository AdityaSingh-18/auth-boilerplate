import { NextResponse } from "next/server";
import { deleteSession } from "../../../lib/session";

export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json({
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout failed:", error);

    return NextResponse.json(
      { error: "Unable to log out." },
      { status: 500 },
    );
  }
}
