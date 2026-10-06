import dotenv from "dotenv"
dotenv.config({
  path: [".env.local", ".env"],
})


import mongoose from "mongoose"
import { jwtVerify } from "jose"
import Session from "@/models/session"
import type { SocketUser, SocketTokenPayload } from "@/types/socket"


/* =========================================================
   JWT SECRET
========================================================= */

function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.")
  }

  if (secret.length < 32) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters."
    )
  }

  return new TextEncoder().encode(secret)
}

/* =========================================================
   SOCKET AUTHENTICATION
========================================================= */

export async function authenticateSocket(
  token: unknown
): Promise<SocketUser> {
  if (
    typeof token !== "string" ||
    token.trim().length === 0
  ) {
    throw new Error(
      "Authentication token is required."
    )
  }

  const normalizedToken = token.trim()

  try {
    const secret = getJWTSecret()

    /* -----------------------------------------------------
       VERIFY JWT
    ----------------------------------------------------- */

    const verifyOptions: {
      issuer?: string
      audience?: string
    } = {}

    if (process.env.JWT_ISSUER) {
      verifyOptions.issuer =
        process.env.JWT_ISSUER
    }

    if (process.env.JWT_AUDIENCE) {
      verifyOptions.audience =
        process.env.JWT_AUDIENCE
    }

    const { payload } =
      await jwtVerify<SocketTokenPayload>(
        normalizedToken,
        secret,
        verifyOptions
      )

    /* -----------------------------------------------------
       TOKEN TYPE
    ----------------------------------------------------- */

    if (
      payload.type !== undefined &&
      payload.type !== "access"
    ) {
      throw new Error(
        "Invalid authentication token type."
      )
    }

    /* -----------------------------------------------------
       USER ID
    ----------------------------------------------------- */

    const userId =
      typeof payload.sub === "string"
        ? payload.sub
        : typeof payload.userId === "string"
          ? payload.userId
          : null

    if (!userId) {
      throw new Error(
        "Authentication token does not contain a user ID."
      )
    }

    /* -----------------------------------------------------
       SESSION ID
    ----------------------------------------------------- */

    if (
      typeof payload.sessionId !== "string" ||
      payload.sessionId.length === 0
    ) {
      throw new Error(
        "Authentication token does not contain a session ID."
      )
    }

    const sessionId = payload.sessionId

    /* -----------------------------------------------------
       VALIDATE OBJECT IDS
    ----------------------------------------------------- */

    if (
      !mongoose.isValidObjectId(userId) ||
      !mongoose.isValidObjectId(sessionId)
    ) {
      throw new Error(
        "Invalid authentication identifiers."
      )
    }

    /* -----------------------------------------------------
       FIND ACTIVE SESSION
    ----------------------------------------------------- */

    const session = await Session.findOne({
      _id: sessionId,
      userId,
      status: "ACTIVE",
      expiresAt: {
        $gt: new Date(),
      },
    })
      .select("_id userId status expiresAt")
      .lean()

    if (!session) {
      throw new Error(
        "Session is invalid, expired, or revoked."
      )
    }

    /* -----------------------------------------------------
       SUCCESS
    ----------------------------------------------------- */

    return {
      userId: userId.toString(),
      sessionId: session._id.toString(),
    }
  } catch (error) {
    /*
     * Never expose internal JWT/session details
     * to the client.
     */

    if (
      error instanceof Error &&
      process.env.NODE_ENV !== "production"
    ) {
      console.error(
        "Socket authentication error:",
        error.message
      )
    }

    throw new Error(
      "Invalid or expired authentication session."
    )
  }
}