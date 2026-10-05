import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

import { connectDB } from "@/lib/db"
import User from "@/models/user.model"
import { createSession } from "@/services/session.service"
import { errorResponse, successResponse } from "@/lib/response"
import { normalizeEmail } from "@/lib/normalize"
import {
  refreshTokenCookieOptions,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cookies"

/* =========================================================
   POST /api/auth/login
========================================================= */

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const body = await request.json()

    const { email, password } = body

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!email || !password) {
      return errorResponse("Email and password are required.", 400)
    }

    const normalizedEmail = normalizeEmail(email)

    /* =====================================================
       FIND USER
    ===================================================== */

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password")

    if (!user) {
      return errorResponse("Invalid email or password.", 401)
    }

    /* =====================================================
       ACCOUNT STATUS
    ===================================================== */

    if (user.status !== "ACTIVE") {
      return errorResponse("Account is not active.", 403)
    }

    /* =====================================================
       VERIFICATION
    ===================================================== */

    if (!user.emailVerified) {
      return errorResponse("Please verify your email first.", 403)
    }

    if (!user.phoneVerified) {
      return errorResponse("Please verify your phone number first.", 403)
    }

    /* =====================================================
       PASSWORD
    ===================================================== */

    if (!user.password) {
      return errorResponse("This account does not support password login.", 401)
    }

    const passwordValid = await bcrypt.compare(password, user.password)

    if (!passwordValid) {
      return errorResponse("Invalid email or password.", 401)
    }

    /* =====================================================
       SESSION
    ===================================================== */

    const userAgent = request.headers.get("user-agent") || undefined

    const forwardedFor = request.headers.get("x-forwarded-for")

    const ipAddress = forwardedFor?.split(",")[0]?.trim() || undefined

    const session = await createSession({
      userId: user._id.toString(),
      userAgent,
      ipAddress,
    })

    /* =====================================================
       UPDATE LAST LOGIN
    ===================================================== */

    user.lastLoginAt = new Date()

    await user.save()

    /* =====================================================
       RESPONSE
    ===================================================== */

    const response = successResponse("Login successful.", {
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
      },

      accessToken: session.accessToken,

      sessionId: session.sessionId,
    })

    /* =========================================================
   REFRESH TOKEN COOKIE
========================================================= */

    response.cookies.set(
      REFRESH_TOKEN_COOKIE,
      session.refreshToken,
      refreshTokenCookieOptions
    )

    return response
  } catch (error) {
    console.error("LOGIN_ERROR:", error)

    return errorResponse("Unable to login.", 500)
  }
}
