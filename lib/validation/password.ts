import { z } from "zod"

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(254),
})


export const resetPasswordSchema = z.object({
  userId: z
    .string()
    .min(1, "User ID is required."),

  otp: z
    .string()
    .regex(
      /^\d{6}$/,
      "OTP must be a 6-digit code."
    ),

  newPassword: z
    .string()
    .min(
      8,
      "Password must be at least 8 characters."
    )
    .max(
      128,
      "Password cannot exceed 128 characters."
    ),
})