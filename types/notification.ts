import mongoose,{ Document } from "mongoose"

/* =========================================================
   NOTIFICATIONS
========================================================= */

export type NotificationType =
  | "CONNECTION_REQUEST"
  | "CONNECTION_ACCEPTED"
  | "CONNECTION_REJECTED"
  | "CONNECTION_REMOVED"
  | "NEW_MESSAGE"
  | "MESSAGE_READ"
  | "PROFILE_VIEW"
  | "MATCH_FOUND"
  | "SYSTEM"

export type NotificationEntityType =
  | "USER"
  | "CONNECTION"
  | "CONVERSATION"
  | "MESSAGE"
  | "SYSTEM"

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId

  actorId?: mongoose.Types.ObjectId

  type: NotificationType

  title: string

  message: string

  entityType?: NotificationEntityType

  entityId?: mongoose.Types.ObjectId

  metadata?: Record<string, unknown>

  isRead: boolean

  readAt?: Date

  createdAt: Date

  updatedAt: Date
}



export type NotificationChannel =
  | "IN_APP"
  | "EMAIL"
  | "PUSH"
  | "SMS"

export type NotificationStatus =
  | "UNREAD"
  | "READ"