import { NextResponse } from "next/server";
import { deleteSession } from "../../../lib/session";

export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Microsoft logout failed:", error);

    return NextResponse.json(
      { error: "Unable to log out." },
      { status: 500 }
    );
  }
}
