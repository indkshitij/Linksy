import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  sendConnectionRequest,
} from "@/services/connection.service";

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB();

    const requesterId =
      request.headers.get("x-user-id");

    if (!requesterId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { receiverId } = body;

    if (!receiverId) {
      return NextResponse.json(
        {
          success: false,
          error: "receiverId is required.",
        },
        { status: 400 }
      );
    }

    const connection =
      await sendConnectionRequest(
        requesterId,
        receiverId
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Connection request sent.",
        data: connection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Connection request error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send connection request.",
      },
      { status: 400 }
    );
  }
}