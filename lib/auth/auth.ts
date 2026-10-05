import { SignJWT, jwtVerify } from "jose"
import User from "@/models/user.model"
import { NextRequest } from "next/server"
import Session from "@/models/session"
/* =========================================================
   CONFIG
========================================================= */

const ACCESS_TOKEN_EXPIRES_IN = "15m"
const REFRESH_TOKEN_EXPIRES_IN = "30d"

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not defined."
  )
}

const secret = new TextEncoder().encode(
  JWT_SECRET
)

/* =========================================================
   TOKEN PAYLOAD
========================================================= */

export interface AuthTokenPayload {
  userId: string
  sessionId: string
  type: "access" | "refresh"
}

/* =========================================================
   CREATE ACCESS TOKEN
========================================================= */

export async function createAccessToken(
  userId: string,
  sessionId: string
): Promise<string> {
  return new SignJWT({
    userId,
    sessionId,
    type: "access",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(
      ACCESS_TOKEN_EXPIRES_IN
    )
    .sign(secret)
}

/* =========================================================
   CREATE REFRESH TOKEN
========================================================= */

export async function createRefreshToken(
  userId: string,
  sessionId: string
): Promise<string> {
  return new SignJWT({
    userId,
    sessionId,
    type: "refresh",
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(
      REFRESH_TOKEN_EXPIRES_IN
    )
    .sign(secret)
}

/* =========================================================
   VERIFY ACCESS TOKEN
========================================================= */

export async function verifyAccessToken(
  token: string
): Promise<AuthTokenPayload> {
  const { payload } =
    await jwtVerify(
      token,
      secret,
      {
        algorithms: ["HS256"],
      }
    )

  if (
    payload.type !== "access" ||
    typeof payload.userId !== "string" ||
    typeof payload.sessionId !== "string"
  ) {
    throw new Error(
      "Invalid access token."
    )
  }

  return {
    userId: payload.userId,
    sessionId: payload.sessionId,
    type: "access",
  }
}

/* =========================================================
   VERIFY REFRESH TOKEN
========================================================= */

export async function verifyRefreshToken(
  token: string
): Promise<AuthTokenPayload> {
  const { payload } =
    await jwtVerify(
      token,
      secret,
      {
        algorithms: ["HS256"],
      }
    )

  if (
    payload.type !== "refresh" ||
    typeof payload.userId !== "string" ||
    typeof payload.sessionId !== "string"
  ) {
    throw new Error(
      "Invalid refresh token."
    )
  }

  return {
    userId: payload.userId,
    sessionId: payload.sessionId,
    type: "refresh",
  }
}

/* =========================================================
   GET CURRENT USER
========================================================= */

export async function getCurrentUser(
  request: NextRequest
) {
  const authHeader =
    request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error(
      "Authentication required."
    )
  }

  const accessToken =
    authHeader.substring(7)

  const payload =
    await verifyAccessToken(accessToken)

  /* =======================================================
     CHECK SESSION
  ======================================================= */

  const session =
    await Session.findOne({
      _id: payload.sessionId,
      userId: payload.userId,
      status: "ACTIVE",
    })

  if (!session) {
    throw new Error(
      "Session is no longer active."
    )
  }

  if (
    session.expiresAt.getTime() <
    Date.now()
  ) {
    session.status = "EXPIRED"

    await session.save()

    throw new Error(
      "Session has expired."
    )
  }

  /* =======================================================
     GET USER
  ======================================================= */

  const user =
    await User.findById(
      payload.userId
    )

  if (!user) {
    throw new Error(
      "User not found."
    )
  }

  /* =======================================================
     CHECK ACCOUNT STATUS
  ======================================================= */

  if (
    user.status !== "ACTIVE"
  ) {
    throw new Error(
      "Account is not active."
    )
  }

  return user
}