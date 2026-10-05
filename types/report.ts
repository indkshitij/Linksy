
/* =========================================================
   REPORTING & MODERATION
========================================================= */

export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "ABUSE"
  | "SCAM"
  | "FAKE_PROFILE"
  | "IMPERSONATION"
  | "INAPPROPRIATE_CONTENT"
  | "HATE_SPEECH"
  | "SEXUAL_CONTENT"
  | "VIOLENCE"
  | "COPYRIGHT"
  | "PRIVACY"
  | "OTHER"

export type ReportTargetType =
  | "USER"
  | "PROFILE"
  | "MESSAGE"
  | "CONVERSATION"
  | "CONTENT"

export type ReportStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "RESOLVED"
  | "DISMISSED"
  | "ESCALATED"

export type ModerationAction =
  | "WARNING"
  | "CONTENT_REMOVED"
  | "CONTENT_RESTRICTED"
  | "USER_RESTRICTED"
  | "USER_SUSPENDED"
  | "USER_BANNED"
  | "NO_ACTION"

export type ModerationSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"