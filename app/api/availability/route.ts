import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/auth"
import { availabilitySchema } from "@/lib/validation/availability"
import { validateAvailabilityDuration } from "@/lib/availability/availability-validation"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    // Get authenticated user from access token
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
          data: null,
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    const parsed = availabilitySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid availability data.",
          data: parsed.error.flatten(),
        },
        { status: 422 }
      )
    }

    const { mode, start, end, latitude, longitude } = parsed.data

    // Validate mode-specific maximum duration
    validateAvailabilityDuration({
      mode,
      start,
      end,
    })

    // Prevent starting availability in the past
    if (start.getTime() < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message: "Availability cannot start in the past.",
          data: null,
        },
        { status: 422 }
      )
    }

    // Update availability
    user.availabilityStatus = "AVAILABLE"
    user.availabilityMode = mode
    user.availabilityStart = start
    user.availabilityEnd = end

    // Update location when provided
    if (latitude !== undefined && longitude !== undefined) {
      user.location = {
        type: "Point",
        coordinates: [longitude, latitude],
      }
    }

    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: "Availability activated successfully.",
        data: {
          status: user.availabilityStatus,
          mode: user.availabilityMode,
          start: user.availabilityStart,
          end: user.availabilityEnd,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("POST /api/availability error:", error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to activate availability.",
        data: null,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB()

    // Get authenticated user from access token
    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
          data: null,
        },
        { status: 401 }
      )
    }

    user.availabilityStatus = "OFFLINE"
    user.availabilityMode = undefined
    user.availabilityStart = undefined
    user.availabilityEnd = undefined

    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: "Availability turned off successfully.",
        data: {
          status: user.availabilityStatus,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("DELETE /api/availability error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to disable availability.",
        data: null,
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser(request)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
          data: null,
        },
        { status: 401 }
      )
    }

    const now = new Date()

    // Automatically treat expired availability as offline
    if (
      user.availabilityStatus === "AVAILABLE" &&
      user.availabilityEnd &&
      user.availabilityEnd <= now
    ) {
      user.availabilityStatus = "OFFLINE"
      user.availabilityMode = undefined
      user.availabilityStart = undefined
      user.availabilityEnd = undefined

      await user.save()
    }

    return NextResponse.json({
      success: true,
      message: "Availability retrieved successfully.",
      data: {
        status: user.availabilityStatus,
        mode: user.availabilityMode ?? null,
        start: user.availabilityStart ?? null,
        end: user.availabilityEnd ?? null,
      },
    })
  } catch (error) {
    console.error("GET /api/availability error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve availability.",
        data: null,
      },
      { status: 500 }
    )
  }
}