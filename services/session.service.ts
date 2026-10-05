import crypto from "crypto"

import Session from "@/models/session"
import { createAccessToken, createRefreshToken } from "@/lib/auth/auth"

/* =========================================================
   CONFIG
========================================================= */

const REFRESH_TOKEN_DAYS = 30

/* =========================================================
   HASH TOKEN
========================================================= */

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

/* =========================================================
   CREATE SESSION
========================================================= */

interface CreateSessionInput {
  userId: string
  userAgent?: string
  ipAddress?: string
}

export async function createSession({
  userId,
  userAgent,
  ipAddress,
}: CreateSessionInput) {
  /*
   * Create a temporary session ID first.
   * Tokens contain this ID, allowing us to revoke
   * a specific session later.
   */

  const session = new Session({
    userId,
    status: "ACTIVE",
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000),
    userAgent,
    ipAddress,
  })

  const sessionId = session._id.toString()

  /* =======================================================
     CREATE TOKENS
  ======================================================= */

  const accessToken = await createAccessToken(userId, sessionId)

  const refreshToken = await createRefreshToken(userId, sessionId)

  /* =======================================================
     STORE ONLY REFRESH TOKEN HASH
  ======================================================= */

  session.refreshTokenHash = hashToken(refreshToken)

  await session.save()

  return {
    accessToken,
    refreshToken,
    sessionId,
  }
}

/* =========================================================
   VERIFY SESSION
========================================================= */

export async function validateSession(sessionId: string, refreshToken: string) {
  const session = await Session.findOne({
    _id: sessionId,
    status: "ACTIVE",
  }).select("+refreshTokenHash")

  if (!session) {
    throw new Error("Session not found.")
  }

  if (session.expiresAt.getTime() < Date.now()) {
    session.status = "EXPIRED"

    await session.save()

    throw new Error("Session has expired.")
  }

  const incomingHash = hashToken(refreshToken)

  if (incomingHash !== session.refreshTokenHash) {
    throw new Error("Invalid refresh token.")
  }

  return session
}

/* =========================================================
   REVOKE SESSION
========================================================= */

export async function revokeSession(sessionId: string) {
  await Session.findByIdAndUpdate(sessionId, {
    status: "REVOKED",
    revokedAt: new Date(),
  })
}


/* =========================================================
   ROTATE REFRESH TOKEN
========================================================= */

export async function rotateRefreshToken(
  sessionId: string,
  currentRefreshToken: string
) {
  const session =
    await validateSession(
      sessionId,
      currentRefreshToken
    )

  /* =======================================================
     CREATE NEW REFRESH TOKEN
  ======================================================= */

  const newRefreshToken =
    await createRefreshToken(
      session.userId.toString(),
      sessionId
    )

  /* =======================================================
     UPDATE STORED HASH
  ======================================================= */

  session.refreshTokenHash =
    hashToken(newRefreshToken)

  session.expiresAt = new Date(
    Date.now() +
      REFRESH_TOKEN_DAYS *
        24 *
        60 *
        60 *
        1000
  )

  await session.save()

  /* =======================================================
     CREATE NEW ACCESS TOKEN
  ======================================================= */

  const newAccessToken =
    await createAccessToken(
      session.userId.toString(),
      sessionId
    )

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionId,
  }
}

/* =========================================================
   REVOKE ALL USER SESSIONS
========================================================= */

export async function revokeAllUserSessions(
  userId: string
) {
  await Session.updateMany(
    {
      userId,
      status: "ACTIVE",
    },
    {
      $set: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    }
  )
}