import mongoose, { Document } from "mongoose"

/* =========================================================
   SESSION
========================================================= */

export type SessionStatus =
  | "ACTIVE"
  | "REVOKED"
  | "EXPIRED"

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId

  refreshTokenHash: string

  status: SessionStatus

  expiresAt: Date

  revokedAt?: Date

  userAgent?: string

  ipAddress?: string

  createdAt: Date
  updatedAt: Date
}