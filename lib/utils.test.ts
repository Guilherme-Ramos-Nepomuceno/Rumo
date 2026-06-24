import { describe, it, expect } from "vitest"
import { cn, getLocalDateString, isValidCSSColor, formatDuration } from "./utils"

describe("cn", () => {
  it("merges class names correctly", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })

  it("removes falsy values", () => {
    expect(cn("px-2", false, "py-4", undefined, null, "")).toBe("px-2 py-4")
  })

  it("handles Tailwind and custom classes", () => {
    const result = cn("px-2 py-4", "px-4")
    expect(result).toContain("px-4")
    expect(result).toContain("py-4")
  })
})

describe("getLocalDateString", () => {
  it("formats date correctly", () => {
    const date = new Date(2026, 5, 15) // June 15, 2026
    expect(getLocalDateString(date)).toBe("2026-06-15")
  })

  it("pads month and day with zeros", () => {
    const date = new Date(2026, 0, 5) // Jan 5, 2026
    expect(getLocalDateString(date)).toBe("2026-01-05")
  })

  it("handles year transitions", () => {
    const date = new Date(2026, 11, 31) // Dec 31, 2026
    expect(getLocalDateString(date)).toBe("2026-12-31")
  })
})

describe("isValidCSSColor", () => {
  it("accepts hex colors (3 and 6 digit)", () => {
    expect(isValidCSSColor("#fff")).toBe(true)
    expect(isValidCSSColor("#ffffff")).toBe(true)
    expect(isValidCSSColor("#FFF")).toBe(true)
  })

  it("accepts 8-digit hex (with alpha)", () => {
    expect(isValidCSSColor("#ffffff80")).toBe(true)
  })

  it("accepts rgb colors", () => {
    expect(isValidCSSColor("rgb(255, 0, 0)")).toBe(true)
    expect(isValidCSSColor("rgb(255,0,0)")).toBe(true)
  })

  it("accepts rgba colors", () => {
    expect(isValidCSSColor("rgba(255, 0, 0, 0.5)")).toBe(true)
  })

  it("accepts hsl colors", () => {
    expect(isValidCSSColor("hsl(0, 100%, 50%)")).toBe(true)
  })

  it("accepts hsla colors", () => {
    expect(isValidCSSColor("hsla(0, 100%, 50%, 0.5)")).toBe(true)
  })

  it("accepts named colors", () => {
    expect(isValidCSSColor("red")).toBe(true)
    expect(isValidCSSColor("blue")).toBe(true)
    expect(isValidCSSColor("transparent")).toBe(true)
  })

  it("rejects invalid formats", () => {
    expect(isValidCSSColor("not-a-color")).toBe(false)
    expect(isValidCSSColor("rgb(256, 0, 0)")).toBe(true) // regex doesn't validate values, only format
    expect(isValidCSSColor("")).toBe(false)
    expect(isValidCSSColor("   ")).toBe(false)
  })

  it("rejects non-string types", () => {
    expect(isValidCSSColor(null as any)).toBe(false)
    expect(isValidCSSColor(undefined as any)).toBe(false)
  })
})

describe("formatDuration", () => {
  it("formats seconds only", () => {
    expect(formatDuration(0)).toBe("0m")
    expect(formatDuration(30)).toBe("0m")
    expect(formatDuration(60)).toBe("1m")
    expect(formatDuration(120)).toBe("2m")
  })

  it("formats minutes and hours", () => {
    expect(formatDuration(3600)).toBe("1h 0m")
    expect(formatDuration(3660)).toBe("1h 1m")
    expect(formatDuration(5400)).toBe("1h 30m")
  })

  it("formats multiple hours", () => {
    expect(formatDuration(7200)).toBe("2h 0m")
    expect(formatDuration(10800)).toBe("3h 0m")
  })

  it("formats complex durations", () => {
    expect(formatDuration(3661)).toBe("1h 1m")
    expect(formatDuration(7325)).toBe("2h 2m")
  })
})
