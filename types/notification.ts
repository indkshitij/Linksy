
/* =========================================================
   NOTIFICATIONS
========================================================= */

export type NotificationType =
  | "CONNECTION_REQUEST"
  | "CONNECTION_ACCEPTED"
  | "CONNECTION_REJECTED"
  | "NEW_MESSAGE"
  | "PROFILE_VIEW"
  | "MATCH_FOUND"
  | "AVAILABILITY_STARTED"
  | "SECURITY"
  | "SYSTEM"

export type NotificationChannel =
  | "IN_APP"
  | "EMAIL"
  | "PUSH"
  | "SMS"

export type NotificationStatus =
  | "UNREAD"
  | "READ"