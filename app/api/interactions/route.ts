import { NextRequest } from "next/server"
import { connectDB } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/auth"
import { successResponse, errorResponse } from "@/lib/response"
import User from "@/models/user.model"
import Interaction from "@/models/interaction.model"
import Connection from "@/models/connection.model"

const ALLOWED_ACTIONS = ["PASS", "CONNECT"] as const

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const currentUser = await getCurrentUser(request)

    const body = await request.json()

    const { targetUserId, action } = body

    if (!targetUserId || !action) {
      return errorResponse("targetUserId and action are required.", 400)
    }

    if (!ALLOWED_ACTIONS.includes(action)) {
      return errorResponse("Invalid interaction action.", 422)
    }

    if (currentUser._id.toString() === targetUserId) {
      return errorResponse("You cannot interact with yourself.", 400)
    }

    const targetUser = await User.findById(targetUserId)
      .select("_id status privacy")
      .lean()

    if (!targetUser) {
      return errorResponse("Target user not found.", 404)
    }

    if (targetUser.status !== "ACTIVE") {
      return errorResponse("This user is not available.", 403)
    }

    if (targetUser.privacy?.profileVisible === false) {
      return errorResponse("This user's profile is not available.", 403)
    }

    /*
     * CONNECT
     */
    if (action === "CONNECT") {
      if (targetUser.privacy?.allowConnectionRequests === false) {
        return errorResponse(
          "This user is not accepting connection requests.",
          403
        )
      }

      /*
       * Check whether a connection already exists
       * in either direction.
       */
      const existingConnection = await Connection.findOne({
  status: {
    $in: ["PENDING", "ACCEPTED"],
  },
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
})

      if (existingConnection) {
        return errorResponse("A connection already exists or is pending.", 409)
      }

      /*
       * Create or update the interaction.
       *
       * PASS → CONNECT is allowed.
       */
      const interaction = await Interaction.findOneAndUpdate(
        {
          userId: currentUser._id,
          targetUserId,
        },
        {
          $set: {
            action: "CONNECT",
          },
        },
        {
          new: true,
          upsert: true,
        }
      )

      /*
       * Create the pending connection request.
       */
      const connection = await Connection.create({
        requesterId: currentUser._id,
        receiverId: targetUserId,
        status: "PENDING",
      })

      return successResponse(
        "Connection request sent successfully.",
        {
          interactionId: interaction._id,
          connectionId: connection._id,
          status: connection.status,
          targetUserId,
        },
        201
      )
    }

    /*
     * PASS
     *
     * PASS does not create a connection.
     * It simply creates or updates the interaction.
     */
    const interaction = await Interaction.findOneAndUpdate(
      {
        userId: currentUser._id,
        targetUserId,
      },
      {
        $set: {
          action: "PASS",
        },
      },
      {
        new: true,
        upsert: true,
      }
    )

    /*
     * If there is an existing pending connection,
     * cancel it because the user changed their action
     * from CONNECT to PASS.
     */
    await Connection.updateOne(
      {
        requesterId: currentUser._id,
        receiverId: targetUserId,
        status: "PENDING",
      },
      {
        $set: {
          status: "CANCELLED",
        },
      }
    )

    return successResponse(
      "User passed successfully.",
      {
        interactionId: interaction._id,
        action: interaction.action,
        targetUserId: interaction.targetUserId,
      },
      200
    )
  } catch (error) {
    console.error("Interaction error:", error)

    return errorResponse("Failed to process interaction.", 500)
  }
}
// import { NextRequest } from "next/server"
// import { connectDB } from "@/lib/db"
// import { getCurrentUser } from "@/lib/auth/auth"
// import { successResponse, errorResponse } from "@/lib/response"
// import User from "@/models/user.model"
// import Interaction from "@/models/interaction.model"
// import Connection from "@/models/connection.model"

// const ALLOWED_ACTIONS = ["PASS", "CONNECT"] as const

// export async function POST(request: NextRequest) {
//   try {
//     await connectDB()

//     const currentUser = await getCurrentUser(request)

//     const body = await request.json()

//     const { targetUserId, action } = body

//     if (!targetUserId || !action) {
//       return errorResponse("targetUserId and action are required.", 400)
//     }

//     if (!ALLOWED_ACTIONS.includes(action)) {
//       return errorResponse("Invalid interaction action.", 422)
//     }

//     if (currentUser._id.toString() === targetUserId) {
//       return errorResponse("You cannot interact with yourself.", 400)
//     }

//     const targetUser = await User.findById(targetUserId)
//       .select("_id status privacy")
//       .lean()

//     if (!targetUser) {
//       return errorResponse("Target user not found.", 404)
//     }

//     if (targetUser.status !== "ACTIVE") {
//       return errorResponse("This user is not available.", 403)
//     }

//     if (targetUser.privacy?.profileVisible === false) {
//       return errorResponse("This user's profile is not available.", 403)
//     }

//     /*
//      * CONNECT
//      */
//     if (action === "CONNECT") {
//       if (targetUser.privacy?.allowConnectionRequests === false) {
//         return errorResponse(
//           "This user is not accepting connection requests.",
//           403
//         )
//       }

//       const existingConnection = await Connection.findOne({
//         $or: [
//           {
//             requesterId: currentUser._id,
//             recipientId: targetUserId,
//           },
//           {
//             requesterId: targetUserId,
//             recipientId: currentUser._id,
//           },
//         ],
//       })

//       if (existingConnection) {
//         return errorResponse("A connection already exists or is pending.", 409)
//       }

//       const existingInteraction = await Interaction.findOne({
//         userId: currentUser._id,
//         targetUserId,
//       })

//       const interaction = await Interaction.findOneAndUpdate(
//         {
//           userId: currentUser._id,
//           targetUserId,
//         },
//         {
//           $set: {
//             action,
//           },
//         },
//         {
//           new: true,
//           upsert: true,
//         }
//       )

//       // const interaction = await Interaction.create({
//       //   userId: currentUser._id,
//       //   targetUserId,
//       //   action: "CONNECT",
//       // })

//       const connection = await Connection.create({
//         requesterId: currentUser._id,
//         recipientId: targetUserId,
//         status: "PENDING",
//       })

//       return successResponse(
//         "Connection request sent successfully.",
//         {
//           interactionId: interaction._id,
//           connectionId: connection._id,
//           status: connection.status,
//           targetUserId,
//         },
//         201
//       )
//     }

//     const interaction = await Interaction.create({
//       userId: currentUser._id,
//       targetUserId,
//       action: "PASS",
//     })

//     return successResponse(
//       "User passed successfully.",
//       {
//         interactionId: interaction._id,
//         action: interaction.action,
//         targetUserId: interaction.targetUserId,
//       },
//       201
//     )
//   } catch (error) {
//     console.error("Interaction error:", error)

//     return errorResponse("Failed to process interaction.", 500)
//   }
// }
