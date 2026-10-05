import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import User from "@/models/user.model"
import { availabilitySchema } from "@/lib/validation/availability"
import { validateAvailabilityDuration } from "@/lib/availability/availability-validation"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()

    const parsed = availabilitySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid availability data.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      )
    }

    const { mode, start, end, latitude, longitude } = parsed.data

    validateAvailabilityDuration({
      mode,
      start,
      end,
    })

    /*
     * TEMPORARY:
     * Replace this with the authenticated
     * user's ID from your session.
     */
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      )
    }

    const user = await User.findById(userId)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 }
      )
    }

    user.availabilityStatus = "AVAILABLE"
    user.availabilityMode = mode
    user.availabilityStart = start
    user.availabilityEnd = end

    user.location = {
      type: "Point",
      coordinates: [longitude, latitude],
    }

    await user.save()

    return NextResponse.json({
      success: true,
      message: "Availability activated.",
      data: {
        status: user.availabilityStatus,
        mode: user.availabilityMode,
        start: user.availabilityStart,
        end: user.availabilityEnd,
      },
    })
  } catch (error) {
    console.error("Availability API error:", error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update availability.",
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      )
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          availabilityStatus: "OFFLINE",
        },

        $unset: {
          availabilityMode: "",
          availabilityStart: "",
          availabilityEnd: "",
        },
      },
      {
        new: true,
      }
    )

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Availability turned off.",
    })
  } catch (error) {
    console.error("Disable availability error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to disable availability.",
      },
      { status: 500 }
    )
  }
}
