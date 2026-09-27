import { describe, it, expect } from "vitest"
import { getActivityCount, getContributingCategories } from "./activity-data"
import type { ActivityRecord } from "./types"

const day = (s: string) => new Date(s + "T12:00:00")

const sample: ActivityRecord[] = [
  { date: day("2026-01-01"), category: "study", count: 3 },
  { date: day("2026-01-01"), category: "work", count: 2 },
  { date: day("2026-01-01"), category: "others", count: 5 },
  { date: day("2026-01-02"), category: "study", count: 4 },
]

describe("getActivityCount", () => {
  it("returns 0 for null/undefined data", () => {
    expect(getActivityCount(undefined as any, day("2026-01-01"))).toBe(0)
  })

  it("sums all categories for a given date when no category filter", () => {
    expect(getActivityCount(sample, day("2026-01-01"))).toBe(10)
  })

  it("filters by category when provided", () => {
    expect(getActivityCount(sample, day("2026-01-01"), "study")).toBe(3)
  })

  it("returns 0 for a date with no records", () => {
    expect(getActivityCount(sample, day("2026-12-25"))).toBe(0)
  })

  it("matches dates by calendar day regardless of time-of-day", () => {
    expect(getActivityCount(sample, new Date("2026-01-02T23:59:00"), "study")).toBe(4)
  })
})

describe("getContributingCategories", () => {
  it("returns [] for null/undefined data", () => {
    expect(getContributingCategories(undefined as any, day("2026-01-01"))).toEqual([])
  })

  it("returns distinct categories for a date, excluding 'others'", () => {
    const result = getContributingCategories(sample, day("2026-01-01"))
    expect(result).toContain("study")
    expect(result).toContain("work")
    expect(result).not.toContain("others")
    expect(result).toHaveLength(2)
  })

  it("deduplicates repeated categories", () => {
    const dup: ActivityRecord[] = [
      { date: day("2026-03-01"), category: "work", count: 1 },
      { date: day("2026-03-01"), category: "work", count: 2 },
    ]
    expect(getContributingCategories(dup, day("2026-03-01"))).toEqual(["work"])
  })

  it("returns [] for a date with no records", () => {
    expect(getContributingCategories(sample, day("2026-09-09"))).toEqual([])
  })
})
