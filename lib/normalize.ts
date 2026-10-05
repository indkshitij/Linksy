import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js"

/* =========================================================
   EMAIL
========================================================= */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/* =========================================================
   PHONE
========================================================= */

export function normalizePhone(phone: string, defaultCountry?: CountryCode): string {
  const parsed = parsePhoneNumberFromString(phone, defaultCountry)

  if (!parsed || !parsed.isValid()) {
    throw new Error("Invalid phone number.")
  }

  return parsed.number
}