import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "linksy"

/* =========================================================
   REFRESH TOKEN COOKIE
========================================================= */

export const REFRESH_TOKEN_COOKIE = `${APP_NAME}_refresh_token`

export const refreshTokenCookieOptions: Omit<ResponseCookie, "name" | "value"> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth",
  maxAge: 60 * 60 * 24 * 30,
}

/* =========================================================
   ACCESS TOKEN COOKIE
========================================================= */

export const ACCESS_TOKEN_COOKIE = `${APP_NAME}_access_token`

export const accessTokenCookieOptions: Omit<ResponseCookie, "name" | "value"> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 15,
}