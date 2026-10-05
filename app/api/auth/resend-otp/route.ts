import { NextRequest } from "next/server"

import { connectDB } from "@/lib/db"
import User from "@/models/user.model"
import { createOtp } from "@/services/otp.service"
import {
  errorResponse,
  successResponse,
} from "@/lib/response"

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB()

    const body = await request.json()

    const { userId, purpose } = body

    if (!userId || !purpose) {
      return errorResponse(
        "User ID and OTP purpose are required.",
        400
      )
    }

    if (
      purpose !== "PHONE_VERIFICATION"
    ) {
      return errorResponse(
        "Invalid OTP purpose.",
        400
      )
    }

    const user = await User.findById(userId)

    if (!user) {
      return errorResponse(
        "User not found.",
        404
      )
    }

    if (user.phoneVerified) {
      return errorResponse(
        "Phone number is already verified.",
        409
      )
    }

    if (!user.phone) {
      return errorResponse(
        "No phone number is associated with this account.",
        400
      )
    }

    const { otp } = await createOtp({
      userId: user._id,
      identifier: user.phone,
      channel: "SMS",
      purpose: "PHONE_VERIFICATION",
    })

    return successResponse(
      "Phone verification OTP generated.",
      {
        userId: user._id.toString(),

        // TODO
        // Development only.
        // Remove before production.
        otp,
      }
    )
  } catch (error) {
    console.error(
      "RESEND_OTP_ERROR:",
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : "Unable to generate OTP."

    if (
      message.includes("wait")
    ) {
      return errorResponse(
        message,
        429
      )
    }

    return errorResponse(
      "Unable to generate OTP.",
      500
    )
  }
}