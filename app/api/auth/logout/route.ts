import { NextRequest } from "next/server"
import { connectDB } from "@/lib/db"
import { verifyRefreshToken } from "@/lib/auth/auth"
import { revokeSession } from "@/services/session.service"

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000"

const SOCKET_CONTROL_SECRET = process.env.SOCKET_CONTROL_SECRET

import {
  REFRESH_TOKEN_COOKIE,
  refreshTokenCookieOptions,
} from "@/lib/auth/cookies"

import { errorResponse, successResponse } from "@/lib/response"

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value

    /*
     * Even if the cookie is missing,
     * logout should be treated as successful.
     */

    if (!refreshToken) {
      const response = successResponse("Logged out successfully.", null)

      response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
        ...refreshTokenCookieOptions,
        maxAge: 0,
      })

      return response
    }

    try {
      const payload = await verifyRefreshToken(refreshToken)

      /*
       * Revoke the database session first.
       */
      await revokeSession(payload.sessionId)
      if (SOCKET_CONTROL_SECRET) {
        try {
          await fetch(`${SOCKET_SERVER_URL}/internal/disconnect`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SOCKET_CONTROL_SECRET}`,
            },
            body: JSON.stringify({
              sessionId: payload.sessionId,
            }),
          })
        } catch (error) {
          console.error("SOCKET_DISCONNECT_ERROR:", error)
        }
      }
      /*
       * Disconnect all active sockets belonging
       * to this session.
       */
      
    } catch {
      /*
       * Token may already be expired or invalid.
       * We still clear the cookie.
       */
    }

    const response = successResponse("Logged out successfully.", null)

    response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
      ...refreshTokenCookieOptions,
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error("LOGOUT_ERROR:", error)

    return errorResponse("Unable to logout.", 500)
  }
}
