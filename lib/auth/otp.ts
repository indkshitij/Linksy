import crypto from "crypto"

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 5

/* =========================================================
   GENERATE OTP
========================================================= */

export function generateOtp(): string {
  const min = 10 ** (OTP_LENGTH - 1)
  const max = 10 ** OTP_LENGTH

  return crypto
    .randomInt(min, max)
    .toString()
}

/* =========================================================
   HASH OTP
========================================================= */

export function hashOtp(otp: string): string {
  return crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex")
}

/* =========================================================
   VERIFY OTP
========================================================= */

export function verifyOtp(
  otp: string,
  codeHash: string
): boolean {
  const hashedOtp = hashOtp(otp)

  return crypto.timingSafeEqual(
    Buffer.from(hashedOtp),
    Buffer.from(codeHash)
  )
}

/* =========================================================
   EXPIRY
========================================================= */

export function getOtpExpiry(): Date {
  return new Date(
    Date.now() +
      OTP_EXPIRY_MINUTES * 60 * 1000
  )
}

/* =========================================================
   RESEND COOLDOWN
========================================================= */

export function canResendOtp(
  lastSentAt: Date
): boolean {
  const cooldownMs = 60 * 1000

  return (
    Date.now() - lastSentAt.getTime() >=
    cooldownMs
  )
}

/* =========================================================
   CONSTANTS
========================================================= */

export const OTP_CONFIG = {
  length: OTP_LENGTH,
  expiryMinutes: OTP_EXPIRY_MINUTES,
  maxAttempts: 5,
  resendCooldownSeconds: 60,
} as const