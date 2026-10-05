import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Connection from "@/models/connection.model";

interface RouteContext {
  params: Promise<{
    connectionId: string;
  }>;
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
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

    const { connectionId } =
      await context.params;

    const body = await request.json();

    const action = body.action;

    if (
      action !== "ACCEPT" &&
      action !== "REJECT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Action must be ACCEPT or REJECT.",
        },
        { status: 400 }
      );
    }

    const connection =
      await Connection.findById(
        connectionId
      );

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: "Connection request not found.",
        },
        { status: 404 }
      );
    }

    if (
      connection.receiverId.toString() !==
      userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You are not allowed to modify this request.",
        },
        { status: 403 }
      );
    }

    if (
      connection.status !== "PENDING"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This connection request is no longer pending.",
        },
        { status: 400 }
      );
    }

    connection.status =
      action === "ACCEPT"
        ? "ACCEPTED"
        : "REJECTED";

    await connection.save();

    return NextResponse.json({
      success: true,
      message:
        action === "ACCEPT"
          ? "Connection accepted."
          : "Connection rejected.",
      data: connection,
    });
  } catch (error) {
    console.error(
      "Connection update error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update connection.",
      },
      { status: 500 }
    );
  }
}