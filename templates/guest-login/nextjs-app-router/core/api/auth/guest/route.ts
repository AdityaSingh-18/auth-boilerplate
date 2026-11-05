import { NextResponse } from "next/server";
import { startGuestSession } from "../../../lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await startGuestSession();

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          isGuest: user.is_guest,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Guest session creation failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to start a guest session",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
