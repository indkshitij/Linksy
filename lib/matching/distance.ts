import type { DistanceUnit } from "@/types/matching"

const METERS_PER_KILOMETER = 1000
const METERS_PER_MILE = 1609.344
const METERS_PER_FOOT = 0.3048
const METERS_PER_INCH = 0.0254
const METERS_PER_YARD = 0.9144
const METERS_PER_NAUTICAL_MILE = 1852

export function metersToDistance(
  meters: number,
  unit: DistanceUnit = "km"
): number {
  switch (unit) {
    case "m":
      return meters

    case "km":
      return meters / METERS_PER_KILOMETER

    case "in":
      return meters / METERS_PER_INCH

    case "ft":
      return meters / METERS_PER_FOOT

    case "yd":
      return meters / METERS_PER_YARD

    case "mi":
      return meters / METERS_PER_MILE

    case "nmi":
      return meters / METERS_PER_NAUTICAL_MILE

    default:
      return meters / METERS_PER_KILOMETER
  }
}

export function roundDistance(distance: number, decimals = 1): number {
  const factor = 10 ** decimals

  return Math.round(distance * factor) / factor
}

export function formatDistance(
  meters: number,
  unit: DistanceUnit = "km"
): number {
  return roundDistance(metersToDistance(meters, unit))
}
