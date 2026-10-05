import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Interaction from "@/models/interaction.model";
import {
  sendConnectionRequest,
} from "@/services/connection.service";

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB();

    const userId =
      request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      targetUserId,
      action,
    } = body;

    if (
      !targetUserId ||
      !["PASS", "CONNECT"].includes(
        action
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "targetUserId and valid action are required.",
        },
        { status: 400 }
      );
    }

    if (action === "PASS") {
      await Interaction.findOneAndUpdate(
        {
          userId,
          targetUserId,
        },
        {
          userId,
          targetUserId,
          action: "PASS",
        },
        {
          upsert: true,
          new: true,
        }
      );

      return NextResponse.json({
        success: true,
        message: "User passed.",
      });
    }

    const connection =
      await sendConnectionRequest(
        userId,
        targetUserId
      );

    await Interaction.findOneAndUpdate(
      {
        userId,
        targetUserId,
      },
      {
        userId,
        targetUserId,
        action: "CONNECT",
      },
      {
        upsert: true,
        new: true,
      }
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
      "Interaction error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to process interaction.",
      },
      { status: 400 }
    );
  }
}