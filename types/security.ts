
/* =========================================================
   SECURITY
========================================================= */



export type SecurityEventType =
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "PASSWORD_CHANGED"
  | "PASSWORD_RESET"
  | "EMAIL_VERIFIED"
  | "PHONE_VERIFIED"
  | "GOOGLE_LOGIN"
  | "SESSION_CREATED"
  | "SESSION_REVOKED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_DELETED"

export type SecurityRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
