
/* =========================================================
   PRIVACY & DATA REQUESTS
========================================================= */

export type ConsentType =
  | "TERMS_OF_SERVICE"
  | "PRIVACY_POLICY"
  | "MARKETING"
  | "LOCATION"
  | "COOKIES"
  | "ANALYTICS"
  | "PERSONALIZATION"

export type ConsentStatus =
  | "GRANTED"
  | "REVOKED"

export type DataRequestType =
  | "ACCESS"
  | "EXPORT"
  | "CORRECTION"
  | "DELETION"
  | "RESTRICTION"

export type DataRequestStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "REJECTED"
  | "FAILED"
