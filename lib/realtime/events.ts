export const SOCKET_EVENTS = {
  // =========================================================
  // CONNECTION EVENTS
  // =========================================================

  CONNECTION_REQUEST: "connection:request",
  CONNECTION_ACCEPTED: "connection:accepted",
  CONNECTION_REJECTED: "connection:rejected",
  CONNECTION_CANCELLED: "connection:cancelled",
  CONNECTION_REMOVED: "connection:removed",

  // =========================================================
  // NOTIFICATION EVENTS
  // =========================================================

  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_READ_ALL: "notification:read-all",
  NOTIFICATION_DELETED: "notification:deleted",
  NOTIFICATION_COUNT_UPDATED: "notification:count-updated",

  // =========================================================
  // MESSAGE EVENTS
  // =========================================================

  MESSAGE_NEW: "message:new",
  MESSAGE_SENT: "message:sent",
  MESSAGE_DELIVERED: "message:delivered",
  MESSAGE_READ: "message:read",
  MESSAGE_REACTION: "message:reaction",
  MESSAGE_EDITED: "message:edited",
  MESSAGE_DELETED: "message:deleted",

  // =========================================================
  // CONVERSATION EVENTS
  // =========================================================

  CONVERSATION_CREATED: "conversation:created",
  CONVERSATION_UPDATED: "conversation:updated",
  CONVERSATION_ARCHIVED: "conversation:archived",
  CONVERSATION_UNARCHIVED: "conversation:unarchived",
  CONVERSATION_DELETED: "conversation:deleted",
  CONVERSATION_MUTED: "conversation:muted",
  CONVERSATION_UNMUTED: "conversation:unmuted",

  // =========================================================
  // PRESENCE EVENTS
  // =========================================================

  PRESENCE_ONLINE: "presence:online",
  PRESENCE_OFFLINE: "presence:offline",
  PRESENCE_UPDATE: "presence:update",
  PRESENCE_LAST_SEEN: "presence:last-seen",

  // =========================================================
  // TYPING EVENTS
  // =========================================================

  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // =========================================================
  // MESSAGE COMPOSER / ACTIVITY EVENTS
  // =========================================================

  COMPOSER_OPENED: "composer:opened",
  COMPOSER_CLOSED: "composer:closed",

  // =========================================================
  // MATCHING EVENTS
  // =========================================================

  MATCH_FOUND: "match:found",
  MATCH_UPDATED: "match:updated",
  MATCH_EXPIRED: "match:expired",

  // =========================================================
  // AVAILABILITY EVENTS
  // =========================================================

  AVAILABILITY_ONLINE: "availability:online",
  AVAILABILITY_OFFLINE: "availability:offline",
  AVAILABILITY_UPDATED: "availability:updated",
  AVAILABILITY_EXPIRED: "availability:expired",

  // =========================================================
  // PROFILE EVENTS
  // =========================================================

  PROFILE_UPDATED: "profile:updated",
  PROFILE_VISIBILITY_CHANGED: "profile:visibility-changed",

  // =========================================================
  // BLOCK / SAFETY EVENTS
  // =========================================================

  USER_BLOCKED: "user:blocked",
  USER_UNBLOCKED: "user:unblocked",

  // =========================================================
  // USER ACCOUNT EVENTS
  // =========================================================

  USER_UPDATED: "user:updated",
  USER_DEACTIVATED: "user:deactivated",
  USER_REACTIVATED: "user:reactivated",

  // =========================================================
  // SOCKET / CONNECTION LIFECYCLE
  // =========================================================

  SOCKET_CONNECTED: "socket:connected",
  SOCKET_DISCONNECTED: "socket:disconnected",
  SOCKET_RECONNECTING: "socket:reconnecting",
  SOCKET_RECONNECTED: "socket:reconnected",

  // =========================================================
  // REALTIME SYNC EVENTS
  // =========================================================

  SYNC_REQUIRED: "sync:required",
  SYNC_COMPLETED: "sync:completed",

  // =========================================================
  // SYSTEM EVENTS
  // =========================================================

  SYSTEM_NOTIFICATION: "system:notification",
  SYSTEM_ALERT: "system:alert",
  SYSTEM_MAINTENANCE: "system:maintenance",

  // =========================================================
  // ERROR EVENTS
  // =========================================================

  ERROR: "error",
} as const

export type SocketEvent =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]