import { NextResponse } from "next/server";
import { deleteSession } from "../../../lib/session";

export const runtime = "nodejs";

export async function POST() {
  try {
    await deleteSession();

    return NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Logout failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to log out",
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
