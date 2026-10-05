import { z } from "zod"

/* =========================================================
   REGISTER
========================================================= */

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name cannot exceed 80 characters."),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .max(254),

  phone: z
    .string()
    .trim()
    .min(7, "Please provide a valid phone number.")
    .max(20, "Phone number is too long."),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password cannot exceed 128 characters."),

  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username cannot exceed 30 characters.")
    .regex(
      /^[a-z0-9._]+$/,
      "Username can only contain letters, numbers, dots, and underscores."
    ),

  termsAccepted: z
    .boolean()
    .refine(
      (value) => value === true,
      "You must accept the terms and conditions."
    ),

  privacyPolicyAccepted: z
    .boolean()
    .refine(
      (value) => value === true,
      "You must accept the privacy policy."
    ),
})

export type RegisterInput =
  z.infer<typeof registerSchema>