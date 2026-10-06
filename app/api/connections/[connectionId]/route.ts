import { NextRequest } from "next/server"
import { connectDB } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/auth"
import { successResponse, errorResponse } from "@/lib/response"
import Connection from "@/models/connection.model"

interface RouteContext {
  params: Promise<{
    connectionId: string
  }>
}

/* =========================================================
   PATCH
   ACCEPT / REJECT
========================================================= */

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB()

    const currentUser = await getCurrentUser(request)

    const { connectionId } = await context.params

    if (!connectionId) {
      return errorResponse(
        "Connection ID is required.",
        400
      )
    }

    const body = await request.json()

    const { action } = body

    if (!["ACCEPT", "REJECT"].includes(action)) {
      return errorResponse(
        "Action must be ACCEPT or REJECT.",
        422
      )
    }

    const connection =
      await Connection.findById(connectionId)

    if (!connection) {
      return errorResponse(
        "Connection request not found.",
        404
      )
    }

    /*
     * Only the receiver can accept or reject.
     */
    if (
      connection.receiverId.toString() !==
      currentUser._id.toString()
    ) {
      return errorResponse(
        "You are not authorized to update this connection.",
        403
      )
    }

    /*
     * Only pending requests can be
     * accepted or rejected.
     */
    if (connection.status !== "PENDING") {
      return errorResponse(
        "Only pending connection requests can be updated.",
        409
      )
    }

    const newStatus =
      action === "ACCEPT"
        ? "ACCEPTED"
        : "REJECTED"

    connection.status = newStatus

    await connection.save()

    return successResponse(
      action === "ACCEPT"
        ? "Connection request accepted successfully."
        : "Connection request rejected successfully.",
      {
        connectionId: connection._id,
        requesterId: connection.requesterId,
        receiverId: connection.receiverId,
        status: connection.status,
      }
    )
  } catch (error) {
    console.error(
      "Connection update error:",
      error
    )

    return errorResponse(
      "Failed to update connection request.",
      500
    )
  }
}

/* =========================================================
   DELETE
   CANCEL PENDING / REMOVE ACCEPTED
========================================================= */

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    await connectDB()

    const currentUser = await getCurrentUser(request)

    const { connectionId } = await context.params

    if (!connectionId) {
      return errorResponse(
        "Connection ID is required.",
        400
      )
    }

    const connection =
      await Connection.findById(connectionId)

    if (!connection) {
      return errorResponse(
        "Connection not found.",
        404
      )
    }

    const currentUserId =
      currentUser._id.toString()

    const requesterId =
      connection.requesterId.toString()

    const receiverId =
      connection.receiverId.toString()

    /*
     * User must belong to the connection.
     */
    if (
      currentUserId !== requesterId &&
      currentUserId !== receiverId
    ) {
      return errorResponse(
        "You are not authorized to modify this connection.",
        403
      )
    }

    /*
     * Save the previous status before changing it.
     */
    const previousStatus = connection.status

    /*
     * PENDING
     * → only requester can cancel.
     */
    if (previousStatus === "PENDING") {
      if (currentUserId !== requesterId) {
        return errorResponse(
          "Only the requester can cancel a pending connection.",
          403
        )
      }

      connection.status = "CANCELLED"

      await connection.save()

      return successResponse(
        "Connection request cancelled successfully.",
        {
          connectionId: connection._id,
          requesterId: connection.requesterId,
          receiverId: connection.receiverId,
          status: connection.status,
        }
      )
    }

    /*
     * ACCEPTED
     * → either user can remove the connection.
     */
    if (previousStatus === "ACCEPTED") {
      connection.status = "REMOVED"

      await connection.save()

      return successResponse(
        "Connection removed successfully.",
        {
          connectionId: connection._id,
          requesterId: connection.requesterId,
          receiverId: connection.receiverId,
          status: connection.status,
        }
      )
    }

    /*
     * REJECTED / CANCELLED / REMOVED
     * cannot be modified again.
     */
    return errorResponse(
      "This connection cannot be modified.",
      409
    )
  } catch (error) {
    console.error(
      "Connection delete error:",
      error
    )

    return errorResponse(
      "Failed to modify connection.",
      500
    )
  }
}