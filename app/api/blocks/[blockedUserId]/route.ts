import { NextRequest } from "next/server"

import { connectDB } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/auth"
import { successResponse, errorResponse } from "@/lib/response"

import Block from "@/models/block.model"

interface RouteContext {
  params: Promise<{
    blockedUserId: string
  }>
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB()

    const currentUser = await getCurrentUser(request)

    const { blockedUserId } = await context.params

    if (!blockedUserId) {
      return errorResponse(
        "Blocked user ID is required.",
        400
      )
    }

    const block = await Block.findOne({
      blockerId: currentUser._id,
      blockedId: blockedUserId,
    })

    if (!block) {
      return errorResponse(
        "User is not blocked.",
        404
      )
    }

    await Block.deleteOne({
      _id: block._id,
    })

    return successResponse(
      "User unblocked successfully.",
      {
        blockedUserId,
      }
    )
  } catch (error) {
    console.error("Unblock user error:", error)

    return errorResponse(
      "Failed to unblock user.",
      500
    )
  }
}