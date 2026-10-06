import User from "@/models/user.model"
import { calculateMatchScore } from "@/lib/matching/calculate-score"
import { formatDistance } from "@/lib/matching/distance"
import type { DistanceUnit } from "@/types/matching"
import type { MatchingUser } from "@/types/matching"

interface MatchingOptions {
  distanceUnit?: DistanceUnit
  maxDistanceKm?: number
}

interface GeoCandidate {
  _id: string
  name: string
  username: string
  headline?: string
  avatar?: string

  skills: string[]
  interests: string[]

  availabilityMode?: string
  experienceLevel?: string

  distanceMeters: number
}

export async function getMatchingUsers(
  userId: string,
  options: MatchingOptions = {}
) {
  const { distanceUnit = "km", maxDistanceKm = 50 } = options

  const currentUser = await User.findById(userId)
    .select(
      "name username skills interests availabilityMode experienceLevel location"
    )
    .lean()

  if (!currentUser) {
    throw new Error("User not found.")
  }

  if (!currentUser.location || currentUser.location.type !== "Point") {
    return []
  }

  const now = new Date()

  const maxDistanceMeters = maxDistanceKm * 1000

  const candidates = await User.aggregate<GeoCandidate>([
    {
      $geoNear: {
        near: currentUser.location,
        key: "location",
        distanceField: "distanceMeters",
        spherical: true,
        maxDistance: maxDistanceMeters,

        query: {
          _id: {
            $ne: currentUser._id,
          },

          status: "ACTIVE",

          availabilityStatus: "AVAILABLE",

          availabilityStart: {
            $lte: now,
          },

          availabilityEnd: {
            $gt: now,
          },

          emailVerified: true,
          phoneVerified: true,
        },
      },
    },

    {
      $project: {
        _id: 1,
        name: 1,
        username: 1,
        headline: 1,
        avatar: 1,

        skills: 1,
        interests: 1,

        availabilityMode: 1,
        experienceLevel: 1,

        distanceMeters: 1,
      },
    },
  ])

  const matches: MatchingUser[] = candidates.map((candidate) => {
    const distanceKm = candidate.distanceMeters / 1000

    const result = calculateMatchScore({
      userSkills: currentUser.skills ?? [],
      userInterests: currentUser.interests ?? [],

      targetSkills: candidate.skills ?? [],
      targetInterests: candidate.interests ?? [],

      userMode: currentUser.availabilityMode,
      targetMode: candidate.availabilityMode,

      userExperienceLevel: currentUser.experienceLevel,

      targetExperienceLevel: candidate.experienceLevel,

      distanceKm,
    })

    return {
      _id: candidate._id.toString(),

      name: candidate.name,
      username: candidate.username,

      headline: candidate.headline,
      avatar: candidate.avatar,

      skills: candidate.skills ?? [],
      interests: candidate.interests ?? [],

      availabilityMode: candidate.availabilityMode,

      experienceLevel: candidate.experienceLevel,

      distanceKm,

      distance: formatDistance(candidate.distanceMeters, distanceUnit),

      distanceUnit,

      ...result,
    }
  })

  matches.sort((a, b) => b.score - a.score)

  return matches
}
