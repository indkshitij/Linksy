import { NextRequest } from "next/server"

import { connectDB } from "@/lib/db"
import {
  verifyRefreshToken,
} from "@/lib/auth/auth"
import {
  rotateRefreshToken,
} from "@/services/session.service"
import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
} from "@/lib/auth/cookies"
import {
  errorResponse,
  successResponse,
} from "@/lib/response"

export async function POST(
  request: NextRequest
) {
  try {
    await connectDB()

    /* =====================================================
       GET REFRESH TOKEN
    ===================================================== */

    const refreshToken =
      request.cookies.get(
        REFRESH_TOKEN_COOKIE
      )?.value

    if (!refreshToken) {
      return errorResponse(
        "Refresh token is required.",
        401
      )
    }

    /* =====================================================
       VERIFY REFRESH TOKEN
    ===================================================== */

    const payload =
      await verifyRefreshToken(
        refreshToken
      )

    /* =====================================================
       ROTATE TOKEN
    ===================================================== */

    const tokens =
      await rotateRefreshToken(
        payload.sessionId,
        refreshToken
      )

    /* =====================================================
       RESPONSE
    ===================================================== */

    const response =
      successResponse(
        "Token refreshed successfully.",
        {
          accessToken:
            tokens.accessToken,
          sessionId:
            tokens.sessionId,
        }
      )

    /* =====================================================
       SET NEW REFRESH TOKEN
    ===================================================== */

    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      refreshTokenCookieOptions
    )

    return response
  } catch (error) {
    console.error(
      "REFRESH_TOKEN_ERROR:",
      error
    )

    return errorResponse(
      "Invalid or expired refresh token.",
      401
    )
  }
}