import { OAuth2Client } from "google-auth-library"

/* =========================================================
   CONFIG
========================================================= */

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

if (!GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not defined.")
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

/* =========================================================
   VERIFY GOOGLE ID TOKEN
========================================================= */

export async function verifyGoogleIdToken(idToken: string) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  })

  const payload = ticket.getPayload()

  if (!payload) {
    throw new Error("Invalid Google ID token.")
  }

  if (!payload.sub) {
    throw new Error("Google account ID is missing.")
  }

  if (!payload.email) {
    throw new Error("Google email is missing.")
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    emailVerified: payload.email_verified === true,
    name: payload.name || "",
    avatar: payload.picture || undefined,
  }
}
