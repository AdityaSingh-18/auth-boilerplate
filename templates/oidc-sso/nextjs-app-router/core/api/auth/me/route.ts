import { NextResponse } from "next/server";

import { findUserById } from "../../../lib/auth-db";
import { getSession } from "../../../lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        success: false,
        error: "Not authenticated",
      },
      { status: 401 },
    );
  }

  const user = await findUserById(session.userId);

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        error: "User not found",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
    },
  });
}
