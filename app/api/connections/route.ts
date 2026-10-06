import { NextRequest } from "next/server"
import { connectDB } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/auth"
import { successResponse, errorResponse } from "@/lib/response"
import Connection from "@/models/connection.model"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const currentUser = await getCurrentUser(request)

    const connections = await Connection.find({
      $or: [
        {
          requesterId: currentUser._id,
        },
        {
          receiverId: currentUser._id,
        },
      ],
    })
      .populate(
        "requesterId",
        "name username headline avatar"
      )
      .populate(
        "receiverId",
        "name username headline avatar"
      )
      .sort({
        updatedAt: -1,
      })
      .lean()

    const accepted = []
    const incoming = []
    const outgoing = []

    for (const connection of connections) {
      const requesterId =
        connection.requesterId._id.toString()

      const receiverId =
        connection.receiverId._id.toString()

      const currentUserId =
        currentUser._id.toString()

      if (connection.status === "ACCEPTED") {
        const otherUser =
          requesterId === currentUserId
            ? connection.receiverId
            : connection.requesterId

        accepted.push({
          connectionId: connection._id,
          user: otherUser,
          status: connection.status,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        })

        continue
      }

      if (connection.status !== "PENDING") {
        continue
      }

      if (receiverId === currentUserId) {
        incoming.push({
          connectionId: connection._id,
          user: connection.requesterId,
          status: connection.status,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        })

        continue
      }

      if (requesterId === currentUserId) {
        outgoing.push({
          connectionId: connection._id,
          user: connection.receiverId,
          status: connection.status,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        })
      }
    }

    return successResponse(
      "Connections retrieved successfully.",
      {
        accepted,
        incoming,
        outgoing,
      }
    )
  } catch (error) {
    console.error(
      "Get connections error:",
      error
    )

    return errorResponse(
      "Failed to retrieve connections.",
      500
    )
  }
}