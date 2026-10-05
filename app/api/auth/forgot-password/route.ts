import { NextRequest } from "next/server"

import { connectDB } from "@/lib/db"
import User from "@/models/user.model"
import { createOtp } from "@/services/otp.service"
import { normalizeEmail } from "@/lib/normalize"
import { forgotPasswordSchema } from "@/lib/validation/password"
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

    const result =
      forgotPasswordSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(
        result.error.issues[0]?.message ||
          "Invalid email address.",
        422
      )
    }

    const email =
      normalizeEmail(result.data.email)

    const user =
      await User.findOne({ email })

    /*
     * Never reveal whether the account exists.
     */
    if (!user) {
      return successResponse(
        "If an account exists for this email, a password reset code has been sent.",
        null
      )
    }

    /*
     * Only active accounts can reset passwords.
     */
    if (user.status !== "ACTIVE") {
      return successResponse(
        "If an account exists for this email, a password reset code has been sent.",
        null
      )
    }

    const { otp } =
      await createOtp({
        userId: user._id,
        identifier: user.email,
        channel: "EMAIL",
        purpose: "PASSWORD_RESET",
      })

    /*
     * Development only.
     * Remove before production.
     */
    console.log(
      `PASSWORD_RESET_OTP: ${otp}`
    )

    return successResponse(
      "If an account exists for this email, a password reset code has been sent.",
      null
    )
  } catch (error) {
    console.error(
      "FORGOT_PASSWORD_ERROR:",
      error
    )

    return errorResponse(
      "Unable to process password reset request.",
      500
    )
  }
}