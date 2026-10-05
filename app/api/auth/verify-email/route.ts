import { NextRequest } from "next/server"

import { connectDB } from "@/lib/db"
import User from "@/models/user.model"
import { verifyUserOtp } from "@/services/otp.service"
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

    const { userId, otp } = body

    if (!userId || !otp) {
      return errorResponse(
        "User ID and OTP are required.",
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

    if (user.emailVerified) {
      return errorResponse(
        "Email is already verified.",
        409
      )
    }

    /* =====================================================
       VERIFY OTP
    ===================================================== */

    await verifyUserOtp({
      userId: user._id,
      purpose: "EMAIL_VERIFICATION",
      otp: String(otp),
    })

    /* =====================================================
       UPDATE USER
    ===================================================== */

    user.emailVerified = true
    user.emailVerifiedAt = new Date()

    await user.save()

    return successResponse(
      "Email verified successfully.",
      {
        userId: user._id.toString(),
        emailVerified: true,
      }
    )
  } catch (error) {
    console.error(
      "VERIFY_EMAIL_ERROR:",
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify email."

    if (
      message.includes("OTP") ||
      message.includes("verification")
    ) {
      return errorResponse(
        message,
        400
      )
    }

    return errorResponse(
      "Unable to verify email.",
      500
    )
  }
}