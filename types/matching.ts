export type DistanceUnit = "m" | "km" | "in" | "ft" | "yd" | "mi" | "nmi"


export interface MatchInput {
  userSkills: string[]
  userInterests: string[]

  targetSkills: string[]
  targetInterests: string[]

  userMode?: string
  targetMode?: string

  userExperienceLevel?: string
  targetExperienceLevel?: string

  distanceKm?: number
}

export interface MatchScoreBreakdown {
  skills: number
  interests: number
  mode: number
  distance: number
  experience: number
}

export interface MatchScoreResult {
  score: number
  commonSkills: string[]
  commonInterests: string[]
  breakdown: MatchScoreBreakdown
}


export interface MatchingUser extends MatchScoreResult {
  _id: string
  name: string
  username: string
  headline?: string
  avatar?: string

  skills: string[]
  interests: string[]

  availabilityMode?: string
  experienceLevel?: string

  distanceKm?: number

  distance: number
  distanceUnit: DistanceUnit
}