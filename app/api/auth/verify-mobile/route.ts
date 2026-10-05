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

    if (user.phoneVerified) {
      return errorResponse(
        "Phone number is already verified.",
        409
      )
    }

    /* =====================================================
       VERIFY PHONE OTP
    ===================================================== */

    await verifyUserOtp({
      userId: user._id,
      purpose: "PHONE_VERIFICATION",
      otp: String(otp),
    })

    /* =====================================================
       UPDATE USER
    ===================================================== */

    user.phoneVerified = true
    user.phoneVerifiedAt = new Date()

    /* =====================================================
       ACTIVATE ACCOUNT
       Only after both email and phone are verified.
    ===================================================== */

    if (user.emailVerified) {
      user.status = "ACTIVE"
    }

    await user.save()

    return successResponse(
      "Phone number verified successfully.",
      {
        userId: user._id.toString(),
        phoneVerified: true,
        accountStatus: user.status,
      }
    )
  } catch (error) {
    console.error(
      "VERIFY_PHONE_ERROR:",
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify phone number."

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
      "Unable to verify phone number.",
      500
    )
  }
}