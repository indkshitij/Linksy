
/* =========================================================
   CONNECTIONS
========================================================= */

export type ConnectionStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "REMOVED"

export type ConnectionAction =
  | "SEND"
  | "ACCEPT"
  | "REJECT"
  | "CANCEL"
  | "REMOVE"
