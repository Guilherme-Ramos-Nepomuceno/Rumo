import type { Category, Difficulty } from "./types"

export interface PerformanceDataPoint {
  date: Date
  category: Category
  objectiveTitle: string
  expectedDifficulty: number // 1-5
  actualDifficulty: number // 1-5
  expectedSatisfaction: number // 1-5
  actualSatisfaction: number // 1-5
}

// Helper function to convert difficulty to number
export function difficultyToNumber(difficulty: Difficulty): number {
  switch (difficulty) {
    case "very-easy":
      return 1
    case "easy":
      return 2
    case "medium":
      return 3
    case "hard":
      return 4
    case "very-hard":
      return 5
    default:
      return 3
  }
}

export function numberToDifficulty(num: number): Difficulty {
  if (num <= 1) return "very-easy"
  if (num <= 2) return "easy"
  if (num <= 3) return "medium"
  if (num <= 4) return "hard"
  return "very-hard"
}

// Mock performance data for the last 30 days
export const mockPerformanceData: PerformanceDataPoint[] = [
  {
    date: new Date(2026, 0, 1),
    category: "study",
    objectiveTitle: "Estudar React",
    expectedDifficulty: 3,
    actualDifficulty: 2,
    expectedSatisfaction: 4,
    actualSatisfaction: 5,
  },
  {
    date: new Date(2026, 0, 2),
    category: "work",
    objectiveTitle: "Reunião com cliente",
    expectedDifficulty: 3,
    actualDifficulty: 4,
    expectedSatisfaction: 3,
    actualSatisfaction: 3,
  },
  {
    date: new Date(2026, 0, 3),
    category: "training",
    objectiveTitle: "Corrida 5km",
    expectedDifficulty: 3,
    actualDifficulty: 3,
    expectedSatisfaction: 4,
    actualSatisfaction: 4,
  },
  {
    date: new Date(2026, 0, 4),
    category: "study",
    objectiveTitle: "Estudar TypeScript",
    expectedDifficulty: 4,
    actualDifficulty: 3,
    expectedSatisfaction: 4,
    actualSatisfaction: 5,
  },
  {
    date: new Date(2026, 0, 5),
    category: "water",
    objectiveTitle: "Beber 2L água",
    expectedDifficulty: 2,
    actualDifficulty: 1,
    expectedSatisfaction: 3,
    actualSatisfaction: 4,
  },
  {
    date: new Date(2026, 0, 6),
    category: "work",
    objectiveTitle: "Apresentação projeto",
    expectedDifficulty: 4,
    actualDifficulty: 5,
    expectedSatisfaction: 3,
    actualSatisfaction: 2,
  },
  {
    date: new Date(2026, 0, 7),
    category: "training",
    objectiveTitle: "Academia",
    expectedDifficulty: 3,
    actualDifficulty: 3,
    expectedSatisfaction: 4,
    actualSatisfaction: 4,
  },
]
