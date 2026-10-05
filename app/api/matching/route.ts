import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import Block from "@/models/block.model";
import Interaction from "@/models/interaction.model";
import Connection from "@/models/connection.model";
import { calculateMatchScore } from "@/lib/matching/calculate-score";

const MAX_DISTANCE_KM = 100;

export async function GET(
  request: NextRequest
) {
  try {
    await connectDB();

    const userId =
      request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required.",
        },
        { status: 401 }
      );
    }

    const currentUser =
      await User.findById(userId).lean();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found.",
        },
        { status: 404 }
      );
    }

    if (
      !currentUser.location ||
      !currentUser.location.coordinates
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please add your location before discovering people.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const blockedUsers =
      await Block.find({
        $or: [
          { blockerId: userId },
          { blockedId: userId },
        ],
      })
        .select("blockerId blockedId")
        .lean();

    const blockedIds =
      blockedUsers.map((block) =>
        block.blockerId.toString() === userId
          ? block.blockedId
          : block.blockerId
      );

    const interactions =
      await Interaction.find({
        userId,
        action: "PASS",
      })
        .select("targetUserId")
        .lean();

    const passedIds =
      interactions.map(
        (interaction) =>
          interaction.targetUserId
      );

    const connections =
      await Connection.find({
        $or: [
          { requesterId: userId },
          { receiverId: userId },
        ],
        status: {
          $in: ["PENDING", "ACCEPTED"],
        },
      })
        .select("requesterId receiverId")
        .lean();

    const connectionIds =
      connections.map((connection) => {
        return connection.requesterId.toString() ===
          userId
          ? connection.receiverId
          : connection.requesterId;
      });

    const excludedIds = [
      userId,
      ...blockedIds,
      ...passedIds,
      ...connectionIds,
    ];

    const candidates =
      await User.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates:
                currentUser.location.coordinates,
            },

            distanceField:
              "distanceInMeters",

            spherical: true,

            maxDistance:
              MAX_DISTANCE_KM * 1000,

            query: {
              _id: {
                $nin: excludedIds,
              },

              availabilityStatus:
                "AVAILABLE",

              availabilityEnd: {
                $gt: now,
              },
            },
          },
        },

        {
          $limit: 100,
        },

        {
          $project: {
            password: 0,
          },
        },
      ]);

    const results = candidates
      .map((candidate) => {
        const distanceKm =
          candidate.distanceInMeters /
          1000;

        const match =
          calculateMatchScore({
            userSkills:
              currentUser.skills || [],

            userInterests:
              currentUser.interests || [],

            targetSkills:
              candidate.skills || [],

            targetInterests:
              candidate.interests || [],

            userMode:
              currentUser.availabilityMode,

            targetMode:
              candidate.availabilityMode,

            distanceKm,
          });

        return {
          ...candidate,

          distanceKm: Number(
            distanceKm.toFixed(1)
          ),

          matchScore: match.score,

          commonSkills:
            match.commonSkills,

          commonInterests:
            match.commonInterests,
        };
      })
      .sort(
        (a, b) =>
          b.matchScore - a.matchScore
      );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error(
      "Matching API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to find matching users.",
      },
      { status: 500 }
    );
  }
}