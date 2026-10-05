import crypto from "crypto"

import { Types } from "mongoose"

import OtpVerification from "@/models/otp.verification"
import {
  canResendOtp,
  generateOtp,
  getOtpExpiry,
  hashOtp,
  verifyOtp,
} from "@/lib/auth/otp"

import type {
  OtpChannel,
  OtpPurpose,
} from "@/types/otp"

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_ATTEMPTS = 5

/* =========================================================
   CREATE OTP
========================================================= */

interface CreateOtpInput {
  userId: Types.ObjectId | string
  identifier: string
  channel: OtpChannel
  purpose: OtpPurpose
}

export async function createOtp({
  userId,
  identifier,
  channel,
  purpose,
}: CreateOtpInput) {
  const existingOtp =
    await OtpVerification.findOne({
      userId,
      purpose,
      status: "PENDING",
    }).sort({ createdAt: -1 })

  /* Prevent rapid OTP spam */
  if (
    existingOtp &&
    !canResendOtp(existingOtp.lastSentAt)
  ) {
    throw new Error(
      "Please wait before requesting another OTP."
    )
  }

  /* Invalidate previous OTP */
  if (existingOtp) {
    existingOtp.status = "EXPIRED"
    await existingOtp.save()
  }

  const otp = generateOtp()
  const codeHash = hashOtp(otp)

  const otpVerification =
    await OtpVerification.create({
      userId,
      identifier,
      channel,
      purpose,
      codeHash,
      status: "PENDING",
      attempts: 0,
      lastSentAt: new Date(),
      expiresAt: getOtpExpiry(),
    })

  return {
    otp,
    otpVerification,
  }
}

/* =========================================================
   VERIFY OTP
========================================================= */

interface VerifyOtpInput {
  userId: Types.ObjectId | string
  purpose: OtpPurpose
  otp: string
}

export async function verifyUserOtp({
  userId,
  purpose,
  otp,
}: VerifyOtpInput) {
  const record =
    await OtpVerification.findOne({
      userId,
      purpose,
      status: "PENDING",
    })
      .select("+codeHash")
      .sort({ createdAt: -1 })

  if (!record) {
    throw new Error(
      "No active OTP verification found."
    )
  }

  /* Check expiration */
  if (record.expiresAt.getTime() < Date.now()) {
    record.status = "EXPIRED"
    await record.save()

    throw new Error("OTP has expired.")
  }

  /* Check attempts */
  if (record.attempts >= MAX_ATTEMPTS) {
    record.status = "BLOCKED"
    await record.save()

    throw new Error(
      "Maximum OTP attempts exceeded."
    )
  }

  const isValid =
    otp.length === 6 &&
    /^\d{6}$/.test(otp) &&
    verifyOtp(otp, record.codeHash)

  if (!isValid) {
    record.attempts += 1

    if (record.attempts >= MAX_ATTEMPTS) {
      record.status = "BLOCKED"
    }

    await record.save()

    throw new Error("Invalid OTP.")
  }

  record.status = "VERIFIED"
  record.verifiedAt = new Date()

  await record.save()

  return record
}

/* =========================================================
   HASH TOKEN
========================================================= */

export function hashToken(
  token: string
): string {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex")
}