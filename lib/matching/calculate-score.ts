interface MatchInput {
  userSkills: string[];
  userInterests: string[];

  targetSkills: string[];
  targetInterests: string[];

  userMode?: string;
  targetMode?: string;

  distanceKm?: number;
}

function normalize(values: string[]) {
  return values.map((value) =>
    value.trim().toLowerCase()
  );
}

function intersection(
  first: string[],
  second: string[]
) {
  const secondSet = new Set(second);

  return first.filter((item) =>
    secondSet.has(item)
  );
}

export function calculateMatchScore({
  userSkills,
  userInterests,
  targetSkills,
  targetInterests,
  userMode,
  targetMode,
  distanceKm,
}: MatchInput) {
  const skillsA = normalize(userSkills);
  const skillsB = normalize(targetSkills);

  const interestsA = normalize(userInterests);
  const interestsB = normalize(targetInterests);

  const commonSkills = intersection(
    skillsA,
    skillsB
  );

  const commonInterests = intersection(
    interestsA,
    interestsB
  );

  const skillScore = Math.min(
    commonSkills.length * 10,
    35
  );

  const interestScore = Math.min(
    commonInterests.length * 5,
    20
  );

  const modeScore =
    userMode &&
    targetMode &&
    (userMode === targetMode ||
      targetMode === "ANYTHING" ||
      userMode === "ANYTHING")
      ? 20
      : 0;

  let distanceScore = 0;

  if (distanceKm !== undefined) {
    if (distanceKm <= 2) {
      distanceScore = 15;
    } else if (distanceKm <= 5) {
      distanceScore = 12;
    } else if (distanceKm <= 10) {
      distanceScore = 9;
    } else if (distanceKm <= 25) {
      distanceScore = 6;
    } else if (distanceKm <= 50) {
      distanceScore = 3;
    }
  }

  const totalScore = Math.min(
    skillScore +
      interestScore +
      modeScore +
      distanceScore,
    100
  );

  return {
    score: totalScore,
    commonSkills,
    commonInterests,
  };
}