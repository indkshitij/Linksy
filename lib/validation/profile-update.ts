import { z } from "zod"

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),

  username: z
    .string()
    .trim()
    .min(3)
    .max(30)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores."
    )
    .optional(),

  avatar: z.string().url().max(500).optional().nullable(),

  cover: z.string().url().max(500).optional().nullable(),

  headline: z.string().trim().max(220).optional().nullable(),

  bio: z.string().trim().max(1000).optional().nullable(),

  about: z.string().trim().max(2000).optional().nullable(),

  city: z.string().trim().max(100).optional().nullable(),

  country: z.string().trim().max(100).optional().nullable(),

  locationVisibility: z
    .enum(["DISTANCE", "CITY", "HIDDEN"])
    .optional(),

  skills: z
    .array(z.string().trim().min(1).max(50))
    .max(30)
    .optional(),

  interests: z
    .array(z.string().trim().min(1).max(50))
    .max(30)
    .optional(),

  experienceLevel: z
    .enum([
      "STUDENT",
      "INTERN",
      "ENTRY",
      "JUNIOR",
      "MID",
      "SENIOR",
      "STAFF",
      "LEAD",
      "PRINCIPAL",
      "DIRECTOR",
      "EXECUTIVE",
    ])
    
    .optional(),

  currentRole: z.string().trim().max(150).optional().nullable(),

  company: z.string().trim().max(150).optional().nullable(),

  experience: z.array(z.record(z.string(), z.unknown())).max(20).optional(),

  education: z.array(z.record(z.string(), z.unknown())).max(20).optional(),

  privacy: z
    .object({
      profileVisible: z.boolean().optional(),
      showEmail: z.boolean().optional(),
      showPhone: z.boolean().optional(),
      showLocation: z.boolean().optional(),
      allowConnectionRequests: z.boolean().optional(),
      allowMessagesFromConnectionsOnly: z.boolean().optional(),
    })
    .optional(),
})