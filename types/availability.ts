import { AVAILABILITY_MODES } from "@/lib/availability/availability"

/* =========================================================
   AVAILABILITY
   ========================================================= */

export type AvailabilityStatus =
  "AVAILABLE" | "BUSY" | "AWAY" | "OFFLINE" | "EXPIRED" | "PAUSED"

// Keep this derived from AVAILABILITY_MODES.
export type AvailabilityMode = keyof typeof AVAILABILITY_MODES
