import mongoose from "mongoose"

/**
 * Creates a private room for a user.
 *
 * Example:
 * user:6ac343fb67643db82fa0b229
 */
export function getUserRoom(
  userId: mongoose.Types.ObjectId | string
): string {
  return `user:${userId.toString()}`
}

/**
 * Creates a room for a conversation.
 *
 * Example:
 * conversation:6ac3abcd123456789
 */
export function getConversationRoom(
  conversationId: mongoose.Types.ObjectId | string
): string {
  return `conversation:${conversationId.toString()}`
}

/**
 * Creates a room for a connection.
 *
 * Useful for connection-specific realtime events.
 */
export function getConnectionRoom(
  connectionId: mongoose.Types.ObjectId | string
): string {
  return `connection:${connectionId.toString()}`
}

/**
 * Creates a room for a notification feed.
 *
 * Kept separate from the user room so notification
 * traffic can be independently controlled later.
 */
export function getNotificationRoom(
  userId: mongoose.Types.ObjectId | string
): string {
  return `notifications:${userId.toString()}`
}

/**
 * Creates a room for a user's matching feed.
 *
 * Useful later for realtime match updates.
 */
export function getMatchingRoom(
  userId: mongoose.Types.ObjectId | string
): string {
  return `matching:${userId.toString()}`
}

/**
 * Creates a room for availability updates.
 *
 * Useful later when nearby users become available
 * or unavailable.
 */
export function getAvailabilityRoom(
  userId: mongoose.Types.ObjectId | string
): string {
  return `availability:${userId.toString()}`
}

export function getSessionRoom(
  sessionId: mongoose.Types.ObjectId | string
): string {
  return `session:${sessionId.toString()}`
}