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
          error: "Not authenticated.",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to retrieve the current user.",
      },
      { status: 500 },
    );
  }
}
