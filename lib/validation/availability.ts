import { z } from "zod";

export const availabilitySchema = z.object({
  mode: z.enum([
    "NETWORKING",
    "COLLABORATION",
    "LEARNING",
    "CHAT",
    "HELP",
    "HIRING",
    "ANYTHING",
  ]),

  start: z.coerce.date(),

  end: z.coerce.date(),

  latitude: z.number().min(-90).max(90),

  longitude: z.number().min(-180).max(180),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),

  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),

  headline: z.string().max(150).optional(),

  bio: z.string().max(300).optional(),

  about: z.string().max(2000).optional(),

  skills: z.array(z.string()).max(30),

  interests: z.array(z.string()).max(30),

  currentRole: z.string().max(100).optional(),

  company: z.string().max(100).optional(),

  experienceLevel: z
    .enum([
      "STUDENT",
      "ENTRY",
      "MID",
      "SENIOR",
      "LEAD",
    ])
    .optional(),

  city: z.string().max(100).optional(),

  country: z.string().max(100).optional(),
});