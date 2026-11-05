import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Not authenticated",
        },
        {
          status: 401,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          isGuest: user.is_guest,
          createdAt: user.created_at,
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
    console.error("Current user lookup failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve the current user",
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
