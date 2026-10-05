/* =========================================================
   OTP
========================================================= */

export type OtpChannel =
  | "EMAIL"
  | "SMS"

export type OtpPurpose =
  | "EMAIL_VERIFICATION"
  | "PHONE_VERIFICATION"
  | "PASSWORD_RESET"
  | "ACCOUNT_RECOVERY"

export type OtpStatus =
  | "PENDING"
  | "VERIFIED"
  | "EXPIRED"
  | "FAILED"
  | "BLOCKED"
