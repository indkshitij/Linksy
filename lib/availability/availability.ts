export const AVAILABILITY_MODES = {
  NETWORKING: {
    label: "Networking",
    description: "Open to meeting and connecting with new people.",
    maxHours: 4,
  },

  COLLABORATION: {
    label: "Collaboration",
    description: "Looking to work together on projects or ideas.",
    maxHours: 6,
  },

  LEARNING: {
    label: "Learning",
    description: "Interested in learning, studying, or exchanging knowledge.",
    maxHours: 4,
  },

  TEACHING: {
    label: "Teaching",
    description: "Available to teach, mentor, or share knowledge.",
    maxHours: 4,
  },

  MENTORING: {
    label: "Mentoring",
    description: "Available to guide someone in a professional or technical area.",
    maxHours: 4,
  },

  COLLABORATIVE_LEARNING: {
    label: "Collaborative Learning",
    description: "Looking to learn together through discussion or practice.",
    maxHours: 4,
  },

  CHAT: {
    label: "Chat",
    description: "Available for casual or professional conversations.",
    maxHours: 8,
  },

  HELP: {
    label: "Help",
    description: "Available to help someone solve a problem or answer a question.",
    maxHours: 2,
  },

  HIRING: {
    label: "Hiring",
    description: "Looking to discover or connect with potential candidates.",
    maxHours: 3,
  },

  JOB_SEEKING: {
    label: "Job Seeking",
    description: "Looking for job opportunities, referrals, or career connections.",
    maxHours: 4,
  },

  FREELANCING: {
    label: "Freelancing",
    description: "Available for freelance work, contracts, or short-term projects.",
    maxHours: 6,
  },

  PROJECT: {
    label: "Project",
    description: "Looking for people to build or contribute to a project.",
    maxHours: 6,
  },

  STARTUP: {
    label: "Startup",
    description: "Interested in startup ideas, co-founders, or early-stage collaboration.",
    maxHours: 6,
  },

  BUSINESS: {
    label: "Business",
    description: "Open to discussing business opportunities and professional partnerships.",
    maxHours: 4,
  },

  INVESTMENT: {
    label: "Investment",
    description: "Interested in discussing investment, funding, or startup opportunities.",
    maxHours: 3,
  },

  EVENT: {
    label: "Event",
    description: "Available to connect with people around an event or meetup.",
    maxHours: 8,
  },

  COMMUNITY: {
    label: "Community",
    description: "Looking to participate in communities and professional groups.",
    maxHours: 8,
  },

  ANYTHING: {
    label: "Anything",
    description: "Open to any meaningful connection or conversation.",
    maxHours: 8,
  },
} as const;

export type AvailabilityMode = keyof typeof AVAILABILITY_MODES;

export function getMaxAvailabilityHours(
  mode: AvailabilityMode
): number {
  return AVAILABILITY_MODES[mode].maxHours;
}