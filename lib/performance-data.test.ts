import { describe, it, expect } from "vitest"
import { difficultyToNumber, numberToDifficulty } from "./performance-data"
import type { Difficulty } from "./types"

describe("difficultyToNumber", () => {
  it("maps each difficulty level to its number", () => {
    expect(difficultyToNumber("very-easy")).toBe(1)
    expect(difficultyToNumber("easy")).toBe(2)
    expect(difficultyToNumber("medium")).toBe(3)
    expect(difficultyToNumber("hard")).toBe(4)
    expect(difficultyToNumber("very-hard")).toBe(5)
  })

  it("falls back to 3 (medium) for an unknown value", () => {
    expect(difficultyToNumber("nonsense" as Difficulty)).toBe(3)
  })
})

describe("numberToDifficulty", () => {
  it("maps numbers to difficulty buckets", () => {
    expect(numberToDifficulty(1)).toBe("very-easy")
    expect(numberToDifficulty(2)).toBe("easy")
    expect(numberToDifficulty(3)).toBe("medium")
    expect(numberToDifficulty(4)).toBe("hard")
    expect(numberToDifficulty(5)).toBe("very-hard")
  })

  it("handles values below the lowest bucket", () => {
    expect(numberToDifficulty(0)).toBe("very-easy")
    expect(numberToDifficulty(-2)).toBe("very-easy")
  })

  it("handles fractional values by rounding up to the next bucket", () => {
    expect(numberToDifficulty(1.5)).toBe("easy")
    expect(numberToDifficulty(3.2)).toBe("hard")
  })

  it("clamps values above the highest bucket to very-hard", () => {
    expect(numberToDifficulty(99)).toBe("very-hard")
  })

  it("round-trips with difficultyToNumber", () => {
    const levels: Difficulty[] = ["very-easy", "easy", "medium", "hard", "very-hard"]
    levels.forEach((level) => {
      expect(numberToDifficulty(difficultyToNumber(level))).toBe(level)
    })
  })
})
