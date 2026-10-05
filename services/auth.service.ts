import bcrypt from "bcryptjs"

import User from "@/models/user.model"
import { createOtp } from "@/services/otp.service"
import { normalizeEmail, normalizePhone } from "@/lib/normalize"
import type { RegisterInput } from "@/lib/validation/register"
import AuthIdentity from "@/models/auth.identity"
import { verifyGoogleIdToken } from "@/lib/auth/google"
import { createSession } from "@/services/session.service"

/* =========================================================
   CONSTANTS
========================================================= */

const PASSWORD_SALT_ROUNDS = 12

/* =========================================================
   REGISTER USER
========================================================= */

export async function registerUser(input: RegisterInput) {
  const email = normalizeEmail(input.email)

  const phone = normalizePhone(input.phone)

  const username = input.username.trim().toLowerCase()

  /* =======================================================
     DUPLICATE CHECK
  ======================================================= */

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }, { username }],
  })
    .select("_id email phone username")
    .lean()

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error("An account with this email already exists.")
    }

    if (existingUser.phone === phone) {
      throw new Error("An account with this phone number already exists.")
    }

    if (existingUser.username === username) {
      throw new Error("This username is already taken.")
    }
  }

  /* =======================================================
     PASSWORD HASH
  ======================================================= */

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS)

  /* =======================================================
     CREATE USER
  ======================================================= */

  const now = new Date()

  const user = await User.create({
    name: input.name.trim(),

    username,

    email,

    emailVerified: false,

    phone,

    phoneVerified: false,

    password: passwordHash,

    authProviders: ["PASSWORD"],

    role: "USER",

    status: "PENDING",

    availabilityStatus: "OFFLINE",

    privacy: {},

    termsAcceptedAt: now,

    privacyPolicyAcceptedAt: now,
  })

  /* =======================================================
     CREATE EMAIL OTP
  ======================================================= */

  const { otp } = await createOtp({
    userId: user._id,
    identifier: email,
    channel: "EMAIL",
    purpose: "EMAIL_VERIFICATION",
  })

  return {
    userId: user._id.toString(),
    email,
    otp,
  }
}

/* =========================================================
   GOOGLE LOGIN
========================================================= */

interface GoogleLoginInput {
  idToken: string
  userAgent?: string
  ipAddress?: string
}

export async function loginWithGoogle({
  idToken,
  userAgent,
  ipAddress,
}: GoogleLoginInput) {
  /* =======================================================
     VERIFY GOOGLE TOKEN
  ======================================================= */

  const googleUser = await verifyGoogleIdToken(idToken)
  if (!googleUser.emailVerified) {
    throw new Error("Google email is not verified.")
  }
  /* =======================================================
     FIND EXISTING GOOGLE IDENTITY
  ======================================================= */

  let identity = await AuthIdentity.findOne({
    provider: "GOOGLE",
    providerAccountId: googleUser.googleId,
  })

  let user

  /* =======================================================
     EXISTING GOOGLE ACCOUNT
  ======================================================= */

  if (identity) {
    user = await User.findById(identity.userId)

    if (!user) {
      throw new Error("Linked user account not found.")
    }
  }

  /* =======================================================
     FIND EXISTING USER BY EMAIL
  ======================================================= */

  if (!user) {
    user = await User.findOne({
      email: googleUser.email,
    })

    if (user) {
      identity = await AuthIdentity.create({
        userId: user._id,
        provider: "GOOGLE",
        providerAccountId: googleUser.googleId,
        email: googleUser.email,
      })

      if (!user.authProviders.includes("GOOGLE")) {
        user.authProviders.push("GOOGLE")
      }

      /*
       * Google verified the email,
       * but does NOT verify phone.
       */
      user.emailVerified = true
      user.emailVerifiedAt = user.emailVerifiedAt || new Date()

      await user.save()
    }
  }

  /* =======================================================
     CREATE NEW USER
  ======================================================= */

  if (!user) {
    /*
     * Username generation will be handled
     * separately to guarantee uniqueness.
     */
    const baseUsername = googleUser.email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._]/g, "")
      .slice(0, 24)

    let username = baseUsername

    let usernameExists = await User.exists({
      username,
    })

    let counter = 1

    while (usernameExists) {
      username = `${baseUsername}${counter}`

      usernameExists = await User.exists({
        username,
      })

      counter++
    }

    user = await User.create({
      name: googleUser.name || "Linksy User",

      username,

      email: googleUser.email,

      emailVerified: true,

      emailVerifiedAt: new Date(),

      phoneVerified: false,

      avatar: googleUser.avatar,

      authProviders: ["GOOGLE"],

      role: "USER",

      status: "PENDING",

      availabilityStatus: "OFFLINE",

      privacy: {},

      termsAcceptedAt: new Date(),

      privacyPolicyAcceptedAt: new Date(),
    })

    identity = await AuthIdentity.create({
      userId: user._id,
      provider: "GOOGLE",
      providerAccountId: googleUser.googleId,
      email: googleUser.email,
    })
  }

  /* =======================================================
     ACCOUNT STATUS
  ======================================================= */

  if (
    user.status === "SUSPENDED" ||
    user.status === "BANNED" ||
    user.status === "DELETED"
  ) {
    throw new Error("Account is not available.")
  }

  /* =======================================================
     PHONE VERIFICATION
  ======================================================= */
  if (!user.phone) {
    return {
      requiresPhoneVerification: true,
      requiresPhoneNumber: true,
      userId: user._id.toString(),
      email: user.email,
    }
  }

  if (!user.phoneVerified) {
    return {
      requiresPhoneVerification: true,
      requiresPhoneNumber: false,
      userId: user._id.toString(),
      email: user.email,
    }
  }

  /* =======================================================
     ACTIVATE ACCOUNT
  ======================================================= */

  user.status = "ACTIVE"
  user.lastLoginAt = new Date()

  await user.save()

  /* =======================================================
     CREATE SESSION
  ======================================================= */

  const session = await createSession({
    userId: user._id.toString(),
    userAgent,
    ipAddress,
  })

  return {
    requiresPhoneVerification: false,
    requiresPhoneNumber: false,

    user: {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
    },

    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    sessionId: session.sessionId,
  }
}
