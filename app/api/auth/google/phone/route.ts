import { NextRequest } from "next/server"

import { connectDB } from "@/lib/db"
import User from "@/models/user.model"

import { normalizePhone } from "@/lib/normalize"
import { createOtp } from "@/services/otp.service"

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

    const {
      userId,
      phone,
    } = body

    if (!userId || !phone) {
      return errorResponse(
        "User ID and phone number are required.",
        400
      )
    }

    /* =====================================================
       FIND USER
    ===================================================== */

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
       NORMALIZE PHONE
    ===================================================== */

    let normalizedPhone: string

    try {
      normalizedPhone =
        normalizePhone(phone)
    } catch {
      return errorResponse(
        "Invalid phone number.",
        422
      )
    }

    /* =====================================================
       CHECK PHONE UNIQUENESS
    ===================================================== */

    const existingUser =
      await User.findOne({
        phone: normalizedPhone,
        _id: {
          $ne: user._id,
        },
      })

    if (existingUser) {
      return errorResponse(
        "This phone number is already associated with another account.",
        409
      )
    }

    /* =====================================================
       SAVE PHONE
    ===================================================== */

    user.phone =
      normalizedPhone

    await user.save()

    /* =====================================================
       CREATE PHONE OTP
    ===================================================== */

    const { otp } =
      await createOtp({
        userId: user._id,
        identifier:
          normalizedPhone,
        channel: "SMS",
        purpose:
          "PHONE_VERIFICATION",
      })

    /* =====================================================
       DEVELOPMENT ONLY
    ===================================================== */

    console.log(
      `GOOGLE_PHONE_VERIFICATION_OTP: ${otp}`
    )

    return successResponse(
      "Phone number added. Verification OTP generated.",
      {
        userId:
          user._id.toString(),

        phone:
          normalizedPhone,

        // Development only.
        // Remove before production.
        otp,
      }
    )
  } catch (error) {
    console.error(
      "GOOGLE_PHONE_ERROR:",
      error
    )

    return errorResponse(
      "Unable to add phone number.",
      500
    )
  }
}