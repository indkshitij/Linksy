import { NextRequest } from "next/server"

import { connectDB } from "@/lib/db"
import { registerSchema } from "@/lib/validation/register"
import { registerUser } from "@/services/auth.service"
import { errorResponse, successResponse } from "@/lib/response"

/* =========================================================
   POST /api/auth/register
========================================================= */

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    /* =====================================================
       PARSE REQUEST
    ===================================================== */

    const body = await request.json()

    /* =====================================================
       VALIDATE INPUT
    ===================================================== */

    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(
        result.error.issues[0]?.message || "Invalid registration data.",
        422,
        result.error.issues
      )
    }

    /* =====================================================
       REGISTER USER
    ===================================================== */

    const resultData = await registerUser(result.data)

    /* =====================================================
       DEVELOPMENT RESPONSE
    ===================================================== */

    return successResponse(
      "Account created. Please verify your email.",
      {
        userId: resultData.userId,
        email: resultData.email,
        
        // TODO 

        // Development only.
        // Remove before production.
        otp: resultData.otp,
      },
      201
    )
  } catch (error) {
    console.error("REGISTER_ERROR:", error)

    const message =
      error instanceof Error ? error.message : "Unable to create account."

    if (
      message.includes("already exists") ||
      message.includes("already taken")
    ) {
      return errorResponse(message, 409)
    }

    if (message.includes("Invalid phone number")) {
      return errorResponse(message, 422)
    }

    return errorResponse("Unable to create account.", 500)
  }
}
