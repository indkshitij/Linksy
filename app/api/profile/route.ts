import { NextRequest } from "next/server"
import { connectDB } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/auth"
import { successResponse, errorResponse } from "@/lib/response"
import { updateProfileSchema } from "@/lib/validation/profile-update"
import User from "@/models/user.model"

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser(request)

    if (!user) {
      return errorResponse("Authentication required.", 401)
    }

    return successResponse("Profile retrieved successfully.", {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,

      avatar: user.avatar,
      coverPhoto: user.coverPhoto,

      headline: user.headline,
      bio: user.bio,
      about: user.about,

      city: user.city,
      country: user.country,
      locationVisibility: user.locationVisibility,

      skills: user.skills,
      interests: user.interests,

      experienceLevel: user.experienceLevel,
      currentRole: user.currentRole,
      company: user.company,
      experience: user.experience,
      education: user.education,

      privacy: {
        profileVisible: user.privacy?.profileVisible,
        showEmail: user.privacy?.showEmail,
        showPhone: user.privacy?.showPhone,
        showLocation: user.privacy?.showLocation,
        allowConnectionRequests: user.privacy?.allowConnectionRequests,
        allowMessagesFromConnectionsOnly:
          user.privacy?.allowMessagesFromConnectionsOnly,
      },

      availabilityStatus: user.availabilityStatus,
      availabilityMode: user.availabilityMode,
      availabilityStart: user.availabilityStart,
      availabilityEnd: user.availabilityEnd,
    })
  } catch (error) {
    console.error("GET /api/profile error:", error)

    return errorResponse("Failed to retrieve profile.", 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB()

    const user = await getCurrentUser(request)

    if (!user) {
      return errorResponse("Authentication required.", 401)
    }

    const body = await request.json()

    const result = updateProfileSchema.safeParse(body)

    if (!result.success) {
      return errorResponse(
        "Invalid profile data.",
        422,
        result.error.flatten()
      )
    }

    const updates = result.data

    if (updates.username) {
      const existingUser = await User.findOne({
        username: updates.username.toLowerCase(),
        _id: { $ne: user._id },
      })

      if (existingUser) {
        return errorResponse("Username is already taken.", 409)
      }

      updates.username = updates.username.toLowerCase()
    }

    Object.assign(user, updates)

    await user.save()

    return successResponse("Profile updated successfully.", {
      id: user._id,
      name: user.name,
      username: user.username,
      headline: user.headline,
      bio: user.bio,
      about: user.about,
      avatar: user.avatar,
      cover: user.coverPhoto,
      city: user.city,
      country: user.country,
      locationVisibility: user.locationVisibility,
      skills: user.skills,
      interests: user.interests,
      experienceLevel: user.experienceLevel,
      currentRole: user.currentRole,
      company: user.company,
      experience: user.experience,
      education: user.education,
      privacy: user.privacy,
    })
  } catch (error) {
    console.error("PATCH /api/profile error:", error)

    return errorResponse("Failed to update profile.", 500)
  }
}