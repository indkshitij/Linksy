import { NextRequest } from "next/server"
import bcrypt from "bcryptjs"

import { connectDB } from "@/lib/db"
import User from "@/models/user.model"

import { resetPasswordSchema } from "@/lib/validation/password"
import { verifyUserOtp } from "@/services/otp.service"
import {
  revokeAllUserSessions,
} from "@/services/session.service"

import {
  errorResponse,
  successResponse,
} from "@/lib/response"

/* =========================================================
   POST /api/auth/reset-password
========================================================= */

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB()

    /* =====================================================
       PARSE REQUEST
    ===================================================== */

    const body = await request.json()

    /* =====================================================
       VALIDATE INPUT
    ===================================================== */

    const result =
      resetPasswordSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(
        result.error.issues[0]?.message ||
          "Invalid password reset data.",
        422
      )
    }

    const {
      userId,
      otp,
      newPassword,
    } = result.data

    /* =====================================================
       FIND USER
    ===================================================== */

    const user =
      await User.findById(userId)

    if (!user) {
      return errorResponse(
        "Unable to reset password.",
        400
      )
    }

    /* =====================================================
       VERIFY OTP
    ===================================================== */

    await verifyUserOtp({
      userId: user._id,
      purpose: "PASSWORD_RESET",
      otp,
    })

    /* =====================================================
       HASH NEW PASSWORD
    ===================================================== */

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      )

    /* =====================================================
       UPDATE PASSWORD
    ===================================================== */

    user.password = passwordHash
    user.passwordChangedAt =
      new Date()
    user.lastPasswordResetAt =
      new Date()

    await user.save()

    /* =====================================================
       REVOKE ALL SESSIONS
    ===================================================== */

    await revokeAllUserSessions(
      user._id.toString()
    )

    /* =====================================================
       RESPONSE
    ===================================================== */

    return successResponse(
      "Password reset successfully.",
      null
    )
  } catch (error) {
    console.error(
      "RESET_PASSWORD_ERROR:",
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : "Unable to reset password."

    if (
      message.includes("OTP") ||
      message.includes("verification") ||
      message.includes("expired") ||
      message.includes("Invalid")
    ) {
      return errorResponse(
        message,
        400
      )
    }

    return errorResponse(
      "Unable to reset password.",
      500
    )
  }
}