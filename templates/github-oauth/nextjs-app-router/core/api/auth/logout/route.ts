import { NextResponse } from "next/server";
import { deleteSession } from "../../../lib/session";

export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json({
      success: true,
      message: "Successfully logged out.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to log out." },
      { status: 500 }
    );
  }
}
