import { NextRequest } from "next/server"

import { getCurrentUser } from "@/lib/auth/auth"
import { errorResponse, successResponse } from "@/lib/response"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)

    return successResponse("Current user retrieved successfully.", {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      status: user.status,
    })
  } catch (error) {
    console.error("GET_CURRENT_USER_ERROR:", error)

    const message =
      error instanceof Error ? error.message : "Authentication required."

    return errorResponse(message, 401)
  }
}
