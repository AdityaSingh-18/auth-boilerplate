import { NextResponse } from "next/server";
import { logoutUser } from "../../../lib/auth";

export async function POST() {
  try {
    await logoutUser();

    return NextResponse.json({
      message: "Successfully logged out.",
    });
  } catch (error) {
    console.error("Logout failed:", error);

    return NextResponse.json(
      { error: "Unable to log out." },
      { status: 500 },
    );
  }
}
