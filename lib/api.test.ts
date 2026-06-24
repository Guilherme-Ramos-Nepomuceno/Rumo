import { describe, it, expect, beforeEach, vi } from "vitest"
import { api } from "./api"

// Helper functions extracted from api.ts for testing
const CAMEL_TO_SNAKE: Record<string, string> = {
  category: "category_id",
  categoryId: "category_id",
}
const SNAKE_TO_CAMEL: Record<string, string> = {
  category_id: "category",
}

function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toSnakeCase)
  if (obj instanceof Date) return obj.toISOString()
  if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    const result: any = {}
    for (const key in obj) {
      if (key === "periodicInterval" && obj[key]) {
        result["periodic_value"] = obj[key].value
        result["periodic_unit"] = obj[key].unit
        continue
      }
      let value = obj[key]
      if ((key === "category" || key === "categoryId") && value && typeof value === "object" && value.id) {
        value = value.id
      }
      if (key === "activeStartedAt" && typeof value === "number") {
        value = new Date(value).toISOString()
      }
      const snakeKey = CAMEL_TO_SNAKE[key] ?? key.replace(/([A-Z])/g, "_$1").toLowerCase()
      result[snakeKey] = toSnakeCase(value)
    }
    return result
  }
  return obj
}

function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    const result: any = {}
    for (const key in obj) {
      if (key === "periodic_value" && obj[key] !== undefined) {
        result["periodicInterval"] = { ...result["periodicInterval"], value: obj[key] }
        continue
      }
      if (key === "periodic_unit" && obj[key] !== undefined) {
        result["periodicInterval"] = { ...result["periodicInterval"], unit: obj[key] }
        continue
      }
      const camelKey = SNAKE_TO_CAMEL[key] ?? key.replace(/(_[a-z])/g, g => g[1].toUpperCase())
      result[camelKey] = toCamelCase(obj[key])
    }
    return result
  }
  return obj
}

describe("Data Transformation - toCamelCase", () => {
  it("converts snake_case keys to camelCase", () => {
    const input = { first_name: "John", last_name: "Doe" }
    const output = toCamelCase(input)
    expect(output).toEqual({ firstName: "John", lastName: "Doe" })
  })

  it("handles nested objects", () => {
    const input = {
      user_profile: {
        first_name: "John",
        last_name: "Doe",
      },
    }
    const output = toCamelCase(input)
    expect(output).toEqual({
      userProfile: {
        firstName: "John",
        lastName: "Doe",
      },
    })
  })

  it("converts category_id to category", () => {
    const input = { category_id: "123", name: "Task" }
    const output = toCamelCase(input)
    expect(output).toEqual({ category: "123", name: "Task" })
  })

  it("handles periodicInterval expansion", () => {
    const input = { periodic_value: 2, periodic_unit: "days", title: "Task" }
    const output = toCamelCase(input)
    expect(output).toEqual({
      periodicInterval: { value: 2, unit: "days" },
      title: "Task",
    })
  })

  it("handles arrays of objects", () => {
    const input = [{ first_name: "John" }, { first_name: "Jane" }]
    const output = toCamelCase(input)
    expect(output).toEqual([{ firstName: "John" }, { firstName: "Jane" }])
  })

  it("preserves primitive values", () => {
    expect(toCamelCase(123)).toBe(123)
    expect(toCamelCase("string")).toBe("string")
    expect(toCamelCase(null)).toBe(null)
    expect(toCamelCase(true)).toBe(true)
  })

  it("handles mixed data structures", () => {
    const input = {
      id: 1,
      user_name: "john",
      is_active: true,
      tags: ["a", "b"],
      metadata: { created_at: "2026-01-01" },
    }
    const output = toCamelCase(input)
    expect(output).toEqual({
      id: 1,
      userName: "john",
      isActive: true,
      tags: ["a", "b"],
      metadata: { createdAt: "2026-01-01" },
    })
  })
})

describe("Data Transformation - toSnakeCase", () => {
  it("converts camelCase keys to snake_case", () => {
    const input = { firstName: "John", lastName: "Doe" }
    const output = toSnakeCase(input)
    expect(output).toEqual({ first_name: "John", last_name: "Doe" })
  })

  it("converts category/categoryId to category_id", () => {
    const input = { category: "123", title: "Task" }
    const output = toSnakeCase(input)
    expect(output).toEqual({ category_id: "123", title: "Task" })
  })

  it("converts category objects to category_id", () => {
    const input = { category: { id: "123", name: "Work" }, title: "Task" }
    const output = toSnakeCase(input)
    expect(output).toEqual({ category_id: "123", title: "Task" })
  })

  it("handles periodicInterval collapse", () => {
    const input = { periodicInterval: { value: 2, unit: "days" }, title: "Task" }
    const output = toSnakeCase(input)
    expect(output).toEqual({
      periodic_value: 2,
      periodic_unit: "days",
      title: "Task",
    })
  })

  it("converts activeStartedAt timestamp to ISO string", () => {
    const timestamp = 1625097600000 // 2021-07-01
    const input = { activeStartedAt: timestamp, title: "Task" }
    const output = toSnakeCase(input)
    expect(output.active_started_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("converts Date objects to ISO string", () => {
    const date = new Date("2026-06-15")
    const input = { createdAt: date }
    const output = toSnakeCase(input)
    expect(output.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("handles arrays of objects", () => {
    const input = [{ firstName: "John" }, { firstName: "Jane" }]
    const output = toSnakeCase(input)
    expect(output).toEqual([{ first_name: "John" }, { first_name: "Jane" }])
  })

  it("preserves primitive values", () => {
    expect(toSnakeCase(123)).toBe(123)
    expect(toSnakeCase("string")).toBe("string")
    expect(toSnakeCase(null)).toBe(null)
    expect(toSnakeCase(false)).toBe(false)
  })

  it("handles nested structures", () => {
    const input = {
      userId: 1,
      userName: "john",
      isActive: true,
      profile: {
        firstName: "John",
        lastName: "Doe",
      },
    }
    const output = toSnakeCase(input)
    expect(output).toEqual({
      user_id: 1,
      user_name: "john",
      is_active: true,
      profile: {
        first_name: "John",
        last_name: "Doe",
      },
    })
  })
})

describe("API - Authentication", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("stores token and user on login", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        token: "test-token",
        user: { id: 1, email: "test@example.com" },
      }))
    )

    await api.auth.login({ email: "test@example.com", password: "password" })

    expect(localStorage.getItem("token")).toBe("test-token")
    expect(JSON.parse(localStorage.getItem("current_user") || "{}")).toEqual({
      id: 1,
      email: "test@example.com",
    })
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({ method: "POST" })
    )
  })

  it("throws on invalid credentials", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    )

    await expect(api.auth.login({ email: "test@example.com", password: "wrong" })).rejects.toThrow(
      "Credenciais inválidas"
    )
  })

  it("clears auth on logout", async () => {
    localStorage.setItem("token", "test-token")
    localStorage.setItem("current_user", JSON.stringify({ id: 1 }))

    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({})))

    await api.auth.logout()

    expect(localStorage.getItem("token")).toBeNull()
    expect(localStorage.getItem("current_user")).toBeNull()
  })
})

describe("API - Sync Queue", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("adds action to sync queue", () => {
    api.sync.push("create_task", { title: "Test" })

    const queue = JSON.parse(localStorage.getItem("rumo_syncQueue") || "[]")
    expect(queue).toHaveLength(1)
    expect(queue[0]).toMatchObject({
      action: "create_task",
      payload: { title: "Test" },
    })
  })

  it("limits queue to 100 items", () => {
    for (let i = 0; i < 105; i++) {
      api.sync.push("test", { index: i })
    }

    const queue = JSON.parse(localStorage.getItem("rumo_syncQueue") || "[]")
    expect(queue).toHaveLength(100)
    expect(queue[0].payload.index).toBe(5) // First 5 items were removed
  })

  it("clears queue on successful sync", async () => {
    api.sync.push("test_action", { data: "test" })

    vi.spyOn(global, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))

    await api.sync.processQueue()

    const queue = JSON.parse(localStorage.getItem("rumo_syncQueue") || "[]")
    expect(queue).toHaveLength(0)
  })
})
