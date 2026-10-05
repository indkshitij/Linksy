import { AVAILABILITY_MODES, AvailabilityMode } from "./availability"

interface ValidateAvailabilityInput {
  mode: AvailabilityMode
  start: Date
  end: Date
}

export function validateAvailabilityDuration({
  mode,
  start,
  end,
}: ValidateAvailabilityInput) {
  if (end <= start) {
    throw new Error("Availability end time must be after start time.")
  }

  const durationMs = end.getTime() - start.getTime()

  const durationHours = durationMs / (1000 * 60 * 60)

  const maxHours = AVAILABILITY_MODES[mode].maxHours

  if (durationHours > maxHours) {
    throw new Error(
      `Maximum availability for ${AVAILABILITY_MODES[mode].label} is ${maxHours} hours.`
    )
  }

  if (durationHours <= 0) {
    throw new Error("Availability duration must be greater than zero.")
  }

  return {
    durationHours,
    maxHours,
  }
}
