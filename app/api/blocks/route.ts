import { NextRequest } from "next/server"
import { connectDB } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/auth"
import {
  successResponse,
  errorResponse,
} from "@/lib/response"
import User from "@/models/user.model"
import Block from "@/models/block.model"
import Connection from "@/models/connection.model"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const currentUser =
      await getCurrentUser(request)

    const body = await request.json()

    const { targetUserId } = body

    if (!targetUserId) {
      return errorResponse(
        "targetUserId is required.",
        400
      )
    }

    /*
     * Prevent self-blocking.
     */
    if (
      currentUser._id.toString() ===
      targetUserId
    ) {
      return errorResponse(
        "You cannot block yourself.",
        400
      )
    }

    /*
     * Check target user.
     */
    const targetUser =
      await User.findById(targetUserId)
        .select("_id status")
        .lean()

    if (!targetUser) {
      return errorResponse(
        "User not found.",
        404
      )
    }

    /*
     * Check whether the user is
     * already blocked.
     */
    const existingBlock =
      await Block.findOne({
        blockerId: currentUser._id,
        blockedId: targetUserId,
      })

    if (existingBlock) {
      return errorResponse(
        "User is already blocked.",
        409
      )
    }

    /*
     * Remove existing pending/accepted
     * connections between both users.
     */
    await Connection.updateMany(
      {
        $or: [
          {
            requesterId: currentUser._id,
            receiverId: targetUserId,
          },
          {
            requesterId: targetUserId,
            receiverId: currentUser._id,
          },
        ],
        status: {
          $in: ["PENDING", "ACCEPTED"],
        },
      },
      {
        $set: {
          status: "REMOVED",
        },
      }
    )

    /*
     * Create block.
     */
    const block = await Block.create({
      blockerId: currentUser._id,
      blockedId: targetUserId,
    })

    return successResponse(
      "User blocked successfully.",
      {
        blockId: block._id,
        blockedId: block.blockedId,
      },
      201
    )
  } catch (error) {
    console.error(
      "Block user error:",
      error
    )

    return errorResponse(
      "Failed to block user.",
      500
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const currentUser = await getCurrentUser(request)

    const blocks = await Block.find({
      blockerId: currentUser._id,
    })
      .populate(
        "blockedId",
        "name username avatar headline"
      )
      .sort({ createdAt: -1 })
      .lean()

    const data = blocks.map((block) => ({
      blockId: block._id,
      user: block.blockedId,
      createdAt: block.createdAt,
    }))

    return successResponse(
      "Blocked users retrieved successfully.",
      {
        blocks: data,
        count: data.length,
      }
    )
  } catch (error) {
    console.error("Get blocked users error:", error)

    return errorResponse(
      "Failed to retrieve blocked users.",
      500
    )
  }
}