import { NextRequest } from "next/server"

import { connectDB } from "@/lib/db"
import { loginWithGoogle } from "@/services/auth.service"
import { errorResponse, successResponse } from "@/lib/response"
import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
} from "@/lib/auth/cookies"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()

    const { idToken } = body

    if (!idToken) {
      return errorResponse("Google ID token is required.", 400)
    }

    /* =====================================================
       REQUEST INFORMATION
    ===================================================== */

    const userAgent = request.headers.get("user-agent") || undefined

    const forwardedFor = request.headers.get("x-forwarded-for")

    const ipAddress = forwardedFor?.split(",")[0]?.trim() || undefined

    /* =====================================================
       GOOGLE LOGIN
    ===================================================== */

    const result = await loginWithGoogle({
      idToken,
      userAgent,
      ipAddress,
    })

    /* =====================================================
       PHONE VERIFICATION REQUIRED
    ===================================================== */

    if (result.requiresPhoneVerification) {
      return successResponse(
        "Google authentication successful. Phone verification is required.",
        {
          requiresPhoneVerification: true,
          requiresPhoneNumber: result.requiresPhoneNumber,
          userId: result.userId,
          email: result.email,
        }
      )
}

    /* =====================================================
       LOGIN SUCCESS
    ===================================================== */

    const response = successResponse("Google login successful.", {
      requiresPhoneVerification: false,

      user: result.user,

      accessToken: result.accessToken,

      sessionId: result.sessionId,
    })

    /* =====================================================
       REFRESH TOKEN COOKIE
    ===================================================== */
    if (!result.refreshToken) {
      return errorResponse(
        "Authentication failed: Refresh token is missing.",
        500
      )
    }

    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      result.refreshToken,
      refreshTokenCookieOptions
    )

    return response
  } catch (error) {
    console.error("GOOGLE_LOGIN_ERROR:", error)

    const message =
      error instanceof Error ? error.message : "Unable to login with Google."

    if (
      message.includes("Google") ||
      message.includes("token") ||
      message.includes("account")
    ) {
      return errorResponse(message, 401)
    }

    return errorResponse("Unable to login with Google.", 500)
  }
}
