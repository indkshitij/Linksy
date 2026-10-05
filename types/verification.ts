
/* =========================================================
   VERIFICATION
========================================================= */

export type VerificationType =
  | "EMAIL"
  | "PHONE"
  | "IDENTITY"
  | "PROFILE"

export type VerificationStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED"

export type IdentityDocumentType =
  | "GOVERNMENT_ID"
  | "PASSPORT"
  | "DRIVING_LICENSE"
  | "NATIONAL_ID"
  | "OTHER"
