import { describe, it, expect, beforeEach, vi } from "vitest"
import { api } from "./api"

function jsonResponse(body: any, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  })
}

describe("api - request layer", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    localStorage.setItem("token", "abc123")
  })

  it("sends credentials and the auth header", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ data: [], categories: [], activity_count: 0 }))

    await api.tasks.list()

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/tasks"),
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({ Authorization: "Bearer abc123" }),
      })
    )
  })

  it("throws a friendly error on a non-ok response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ message: "boom" }, { status: 500 })
    )

    await expect(api.tasks.list()).rejects.toThrow("Erro ao carregar tarefas")
  })

  it("clears the token on a 401 response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    )
    // jsdom doesn't implement navigation; swallow the resulting throw.
    await expect(api.tasks.list()).rejects.toThrow(/Sessão expirada/)
    expect(localStorage.getItem("token")).toBeNull()
  })
})

describe("api.tasks.history - hasMore branch", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    localStorage.setItem("token", "abc123")
  })

  it("reports hasMore=true when meta.has_more_pages is true", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ data: [], meta: { has_more_pages: true } })
    )
    const { hasMore } = await api.tasks.history()
    expect(hasMore).toBe(true)
  })

  it("reports hasMore=false on the last page (no next link)", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ data: [], meta: { has_more_pages: false }, links: { next: null } })
    )
    const { hasMore } = await api.tasks.history()
    expect(hasMore).toBe(false)
  })

  it("reports hasMore=true when a next link is present", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ data: [], meta: { has_more_pages: false }, links: { next: "/tasks/history?page=2" } })
    )
    const { hasMore } = await api.tasks.history()
    expect(hasMore).toBe(true)
  })

  it("passes the requested page in the query string", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(jsonResponse({ data: [], meta: { has_more_pages: false }, links: { next: null } }))

    await api.tasks.history(3)
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("page=3"), expect.anything())
  })

  it("transforms snake_case rows to camelCase", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      jsonResponse({ data: [{ id: "1", category_id: "work", actual_satisfaction: 4 }], meta: { has_more_pages: false }, links: { next: null } })
    )
    const { tasks } = await api.tasks.history()
    expect(tasks[0]).toMatchObject({ category: "work", actualSatisfaction: 4 })
  })
})
