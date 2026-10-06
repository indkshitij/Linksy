import { NextRequest, NextResponse } from "next/server"

import { connectDB } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/auth"

import User from "@/models/user.model"
import Block from "@/models/block.model"
import Interaction from "@/models/interaction.model"
import Connection from "@/models/connection.model"

import { calculateMatchScore } from "@/lib/matching/calculate-score"
import { formatDistance } from "@/lib/matching/distance"

import type { DistanceUnit } from "@/types/matching"

const DEFAULT_MAX_DISTANCE_KM = 100
const MAX_ALLOWED_DISTANCE_KM = 500

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

const DISTANCE_UNITS: DistanceUnit[] = ["m", "km", "mi"]

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    // Authenticate request using access token.
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
          data: null,
        },
        { status: 401 }
      )
    }

    // Location is required for geo-based discovery.
    if (
      !currentUser.location ||
      currentUser.location.type !== "Point" ||
      !currentUser.location.coordinates ||
      currentUser.location.coordinates.length !== 2
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please add your location before discovering people.",
          data: null,
        },
        { status: 400 }
      )
    }

    const searchParams = request.nextUrl.searchParams

    // Distance display unit.
    const requestedUnit = searchParams.get("distanceUnit") ?? "km"

    if (!DISTANCE_UNITS.includes(requestedUnit as DistanceUnit)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid distance unit. Use m, km, or mi.",
          data: null,
        },
        { status: 422 }
      )
    }

    const distanceUnit = requestedUnit as DistanceUnit

    // Maximum discovery radius.
    const maxDistanceParam = searchParams.get("maxDistanceKm")

    const maxDistanceKm = maxDistanceParam
      ? Number(maxDistanceParam)
      : DEFAULT_MAX_DISTANCE_KM

    if (
      !Number.isFinite(maxDistanceKm) ||
      maxDistanceKm <= 0 ||
      maxDistanceKm > MAX_ALLOWED_DISTANCE_KM
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `maxDistanceKm must be between 1 and ${MAX_ALLOWED_DISTANCE_KM}.`,
          data: null,
        },
        { status: 422 }
      )
    }

    // Number of matches to return.
    const limitParam = searchParams.get("limit")

    const limit = limitParam ? Number(limitParam) : DEFAULT_LIMIT

    if (!Number.isInteger(limit) || limit <= 0 || limit > MAX_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          message: `limit must be between 1 and ${MAX_LIMIT}.`,
          data: null,
        },
        { status: 422 }
      )
    }

    const userId = currentUser._id
    const now = new Date()

    /*
     * -------------------------------------------------------
     * BLOCKED USERS
     * -------------------------------------------------------
     *
     * Blocking is bidirectional for discovery.
     *
     * If A blocks B:
     * - A cannot discover B
     * - B cannot discover A
     */

    const blockedUsers = await Block.find({
      $or: [
        { blockerId: userId },
        { blockedId: userId },
      ],
    })
      .select("blockerId blockedId")
      .lean()

    const blockedIds = blockedUsers.map((block) => {
      return block.blockerId.toString() === userId.toString()
        ? block.blockedId
        : block.blockerId
    })

    /*
     * -------------------------------------------------------
     * PASSED USERS
     * -------------------------------------------------------
     *
     * Users the current user already passed
     * should not appear again.
     */

    const interactions = await Interaction.find({
      userId,
      action: "PASS",
    })
      .select("targetUserId")
      .lean()

    const passedIds = interactions.map(
      (interaction) => interaction.targetUserId
    )

    /*
     * -------------------------------------------------------
     * EXISTING CONNECTIONS
     * -------------------------------------------------------
     *
     * Don't show users with an existing pending
     * or accepted connection.
     */

    const connections = await Connection.find({
      $or: [
        { requesterId: userId },
        { receiverId: userId },
      ],
      status: {
        $in: ["PENDING", "ACCEPTED"],
      },
    })
      .select("requesterId receiverId")
      .lean()

    const connectionIds = connections.map((connection) => {
      return connection.requesterId.toString() === userId.toString()
        ? connection.receiverId
        : connection.requesterId
    })

    /*
     * -------------------------------------------------------
     * EXCLUDED USERS
     * -------------------------------------------------------
     */

    const excludedIds = [
      userId,
      ...blockedIds,
      ...passedIds,
      ...connectionIds,
    ]

    /*
     * -------------------------------------------------------
     * GEO DISCOVERY
     * -------------------------------------------------------
     *
     * MongoDB calculates geographic distance.
     *
     * Exact coordinates are never returned to the client.
     */

    const candidates = await User.aggregate([
      {
        $geoNear: {
          near: currentUser.location,
          key: "location",
          distanceField: "distanceInMeters",
          spherical: true,
          maxDistance: maxDistanceKm * 1000,

          query: {
            _id: {
              $nin: excludedIds,
            },

            status: "ACTIVE",

            emailVerified: true,

            phoneVerified: true,

            availabilityStatus: "AVAILABLE",

            availabilityStart: {
              $lte: now,
            },

            availabilityEnd: {
              $gt: now,
            },
          },
        },
      },

      // Keep the candidate pool reasonable.
      {
        $limit: 100,
      },

      // Only return fields required by matching.
      {
        $project: {
          name: 1,
          username: 1,
          avatar: 1,
          headline: 1,
          skills: 1,
          interests: 1,
          availabilityMode: 1,
          experienceLevel: 1,
          distanceInMeters: 1,
        },
      },
    ])

    /*
     * -------------------------------------------------------
     * MATCH SCORING
     * -------------------------------------------------------
     */

    const results = candidates
      .map((candidate) => {
        // MongoDB distance is returned in meters.
        const distanceKm = candidate.distanceInMeters / 1000

        const match = calculateMatchScore({
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

        // Convert distance only for display.
        const displayDistance = formatDistance(
          candidate.distanceInMeters,
          distanceUnit
        )

        return {
          id: candidate._id.toString(),

          name: candidate.name,

          username: candidate.username,

          avatar: candidate.avatar ?? null,

          headline: candidate.headline ?? null,

          skills: candidate.skills ?? [],

          interests: candidate.interests ?? [],

          availabilityMode:
            candidate.availabilityMode ?? null,

          experienceLevel:
            candidate.experienceLevel ?? null,

          distance: displayDistance,

          distanceUnit,

          // Approximate distance only.
          distanceKm: Number(distanceKm.toFixed(1)),

          matchScore: match.score,

          commonSkills: match.commonSkills,

          commonInterests: match.commonInterests,

          scoreBreakdown: match.breakdown,
        }
      })

      // Highest match score first.
      .sort((a, b) => b.matchScore - a.matchScore)

    /*
     * -------------------------------------------------------
     * FINAL RESULT
     * -------------------------------------------------------
     */

    const matches = results.slice(0, limit)

    return NextResponse.json(
      {
        success: true,
        message: "Matches retrieved successfully.",
        data: {
          matches,
          count: matches.length,
          distanceUnit,
          maxDistanceKm,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("GET /api/matching error:", error)

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to find matching users.",
        data: null,
      },
      { status: 500 }
    )
  }
}