import { describe, it, expect } from "vitest"
import { parseTask, resolveCategoryConfig } from "./task-utils"
import type { CustomCategory, Task } from "./types"

describe("parseTask - category resolution", () => {
  it("uses category.id when category is an object", () => {
    const result = parseTask({ category: { id: "cat-1", label: "Work" } })
    expect(result.category).toBe("cat-1")
  })

  it("uses categoryId when category is not an object", () => {
    const result = parseTask({ categoryId: "cat-2" })
    expect(result.category).toBe("cat-2")
  })

  it("uses category_id (snake_case) as last resort", () => {
    const result = parseTask({ category_id: "cat-3" })
    expect(result.category).toBe("cat-3")
  })

  it("keeps a plain string category when no overrides are present", () => {
    const result = parseTask({ category: "work" })
    expect(result.category).toBe("work")
  })

  it("ignores a null category object and falls back", () => {
    const result = parseTask({ category: null, categoryId: "cat-4" })
    expect(result.category).toBe("cat-4")
  })
})

describe("parseTask - date normalisation", () => {
  it("converts startDate / endDate strings to Date objects", () => {
    const result = parseTask({ startDate: "2026-01-01T12:00:00Z", endDate: "2026-01-02T12:00:00Z" })
    expect(result.startDate).toBeInstanceOf(Date)
    expect(result.endDate).toBeInstanceOf(Date)
    expect(result.startDate.getTime()).toBe(new Date("2026-01-01T12:00:00Z").getTime())
  })

  it("falls back to a Date when startDate / endDate are missing", () => {
    const result = parseTask({})
    expect(result.startDate).toBeInstanceOf(Date)
    expect(result.endDate).toBeInstanceOf(Date)
  })

  it("converts createdAt and completedAt when present", () => {
    const result = parseTask({ createdAt: "2026-01-01", completedAt: "2026-01-03" })
    expect((result as Task & { createdAt?: Date }).createdAt).toBeInstanceOf(Date)
    expect(result.completedAt).toBeInstanceOf(Date)
  })

  it("leaves createdAt / completedAt undefined when absent", () => {
    const result = parseTask({})
    expect((result as Task & { createdAt?: Date }).createdAt).toBeUndefined()
    expect(result.completedAt).toBeUndefined()
  })

  it("converts activeStartedAt to a numeric timestamp", () => {
    const iso = "2026-01-01T10:00:00.000Z"
    const result = parseTask({ activeStartedAt: iso })
    expect(typeof result.activeStartedAt).toBe("number")
    expect(result.activeStartedAt).toBe(new Date(iso).getTime())
  })

  it("leaves activeStartedAt undefined when absent", () => {
    const result = parseTask({})
    expect(result.activeStartedAt).toBeUndefined()
  })
})

describe("parseTask - subtasks", () => {
  it("maps subtasks and converts their completedAt to Date", () => {
    const result = parseTask({
      subtasks: [
        { id: "s1", title: "A", completedAt: "2026-01-01" },
        { id: "s2", title: "B" },
      ],
    })
    expect(result.subtasks).toHaveLength(2)
    expect(result.subtasks![0].completedAt).toBeInstanceOf(Date)
    expect(result.subtasks![1].completedAt).toBeUndefined()
  })

  it("leaves subtasks undefined when absent", () => {
    const result = parseTask({})
    expect(result.subtasks).toBeUndefined()
  })

  it("preserves other fields via spread", () => {
    const result = parseTask({ id: "t1", title: "Test", status: "pending", order: 5 })
    expect(result.id).toBe("t1")
    expect(result.title).toBe("Test")
    expect(result.status).toBe("pending")
    expect(result.order).toBe(5)
  })
})

describe("resolveCategoryConfig", () => {
  const custom: CustomCategory[] = [
    { id: "custom-1", label: "Meditação", color: "#ff0000", icon: "Brain" },
    { id: "custom-2", label: "Sem cor", color: "", icon: "" },
  ]

  it("resolves a matching custom category", () => {
    const result = resolveCategoryConfig("custom-1", custom)
    expect(result).toEqual({
      label: "Meditação",
      color: "#ff0000",
      iconName: "Brain",
      isCustom: true,
    })
  })

  it("applies color/icon defaults for a custom category missing them", () => {
    const result = resolveCategoryConfig("custom-2", custom)
    expect(result.color).toBe("#94a3b8")
    expect(result.iconName).toBe("Circle")
    expect(result.isCustom).toBe(true)
  })

  it("resolves a legacy label by category id", () => {
    const result = resolveCategoryConfig("study", custom)
    expect(result).toEqual({
      label: "Estudo",
      color: "#94a3b8",
      iconName: "Circle",
      isCustom: false,
    })
  })

  it("uses the provided fallbackLabel for an unknown id", () => {
    const result = resolveCategoryConfig("unknown-id", custom, "Fallback")
    expect(result.label).toBe("Fallback")
    expect(result.isCustom).toBe(false)
  })

  it("falls back to the id itself when no label or fallback matches", () => {
    const result = resolveCategoryConfig("xyz", custom)
    expect(result.label).toBe("xyz")
  })

  it("falls back to 'Outros' when id is empty and no fallback given", () => {
    const result = resolveCategoryConfig("", custom)
    expect(result.label).toBe("Outros")
  })
})
