import { NextRequest } from "next/server"

import { errorResponse, successResponse } from "@/lib/response"

const SOCKET_CONTROL_SECRET = process.env.SOCKET_CONTROL_SECRET

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000"

export async function POST(request: NextRequest) {
  try {
    if (!SOCKET_CONTROL_SECRET) {
      console.error("SOCKET_CONTROL_SECRET is not configured.")

      return errorResponse("Socket control is not configured.", 500)
    }

    const authorization = request.headers.get("authorization")

    if (authorization !== `Bearer ${SOCKET_CONTROL_SECRET}`) {
      return errorResponse("Unauthorized.", 401)
    }

    const body = await request.json()

    const sessionId = body?.sessionId

    if (typeof sessionId !== "string" || sessionId.length === 0) {
      return errorResponse("sessionId is required.", 400)
    }

    const socketResponse = await fetch(
      `${SOCKET_SERVER_URL}/internal/disconnect`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SOCKET_CONTROL_SECRET}`,
        },
        body: JSON.stringify({
          sessionId,
        }),
      }
    )

    if (!socketResponse.ok) {
      console.error(
        "Socket server rejected disconnect request:",
        socketResponse.status
      )

      return errorResponse("Failed to disconnect socket session.", 502)
    }

    return successResponse("Socket session disconnected successfully.", null)
  } catch (error) {
    console.error("SOCKET_CONTROL_ERROR:", error)

    return errorResponse("Unable to process socket control request.", 500)
  }
}
