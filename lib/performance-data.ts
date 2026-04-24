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
export const mockPerformanceData: PerformanceDataPoint[] = []
