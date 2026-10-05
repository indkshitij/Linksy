
/* =========================================================
   MESSAGING
========================================================= */

export type MessageType =
  | "TEXT"
  | "IMAGE"
  | "FILE"
  | "LINK"
  | "SYSTEM"

export type MessageStatus =
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "DELETED"

export type ConversationStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "DELETED"

