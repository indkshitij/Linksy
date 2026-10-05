import { NextRequest } from "next/server"

import { connectDB } from "@/lib/db"
import User from "@/models/user.model"
import { verifyUserOtp } from "@/services/otp.service"
import {
  createSession,
} from "@/services/session.service"
import {
  errorResponse,
  successResponse,
} from "@/lib/response"
import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
} from "@/lib/auth/cookies"

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB()

    const body = await request.json()

    const {
      userId,
      otp,
    } = body

    if (!userId || !otp) {
      return errorResponse(
        "User ID and OTP are required.",
        400
      )
    }

    const user =
      await User.findById(userId)

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
    user.status = "ACTIVE"
    user.lastLoginAt = new Date()

    await user.save()

    /* =====================================================
       CREATE SESSION
    ===================================================== */

    const userAgent =
      request.headers.get(
        "user-agent"
      ) || undefined

    const forwardedFor =
      request.headers.get(
        "x-forwarded-for"
      )

    const ipAddress =
      forwardedFor
        ?.split(",")[0]
        ?.trim() || undefined

    const session =
      await createSession({
        userId:
          user._id.toString(),
        userAgent,
        ipAddress,
      })

    /* =====================================================
       RESPONSE
    ===================================================== */

    const response =
      successResponse(
        "Phone number verified successfully.",
        {
          user: {
            id:
              user._id.toString(),

            name:
              user.name,

            username:
              user.username,

            email:
              user.email,
          },

          accessToken:
            session.accessToken,

          sessionId:
            session.sessionId,
        }
      )

    /* =====================================================
       REFRESH TOKEN COOKIE
    ===================================================== */

    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      session.refreshToken,
      refreshTokenCookieOptions
    )

    return response
  } catch (error) {
    console.error(
      "GOOGLE_PHONE_VERIFICATION_ERROR:",
      error
    )

    const message =
      error instanceof Error
        ? error.message
        : "Unable to verify phone number."

    if (
      message.includes("OTP") ||
      message.includes("verification") ||
      message.includes("expired")
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