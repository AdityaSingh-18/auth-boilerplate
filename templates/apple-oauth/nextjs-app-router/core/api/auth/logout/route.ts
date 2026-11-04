import { NextResponse } from "next/server";
import { deleteSession } from "../../../lib/session";

export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Apple authentication logout failed:", error);

    return NextResponse.json(
      { error: "Logout failed." },
      { status: 500 }
    );
  }
}
