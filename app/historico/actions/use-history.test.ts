import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, beforeEach, vi } from "vitest"

// The global setup mock returns a fresh router object per render, which makes
// the hook's `[router]` effect dependency loop forever. Pin a stable instance.
vi.mock("next/navigation", () => {
  const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }
  const params = new URLSearchParams()
  return {
    useRouter: () => router,
    useSearchParams: () => params,
    usePathname: () => "/",
  }
})

import { useHistory } from "./use-history"

const completedFixtures = [
  {
    id: "t1",
    title: "Revisar Pull Requests",
    description: "code review",
    category: "work",
    completedAt: "2026-01-15T10:00:00Z",
    elapsedTime: 3600,
    actualSatisfaction: 4,
  },
  {
    id: "t2",
    title: "Estudar Vitest",
    description: "testes unitários",
    category: "study",
    completedAt: "2026-01-20T10:00:00Z",
    elapsedTime: 1800,
    actualSatisfaction: 5,
  },
  {
    id: "t3",
    title: "Correr no parque",
    description: "exercício",
    category: "training",
    completedAt: "2026-02-01T10:00:00Z",
    elapsedTime: 2400,
    actualSatisfaction: 3,
  },
]

function seedStorage() {
  localStorage.setItem("token", "test-token")
  localStorage.setItem("rumo_completed_tasks", JSON.stringify(completedFixtures))
}

describe("useHistory", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("mounts and finishes loading", async () => {
    seedStorage()
    const { result } = renderHook(() => useHistory())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.mounted).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it("loads completed tasks from localStorage into grouped months", async () => {
    seedStorage()
    const { result } = renderHook(() => useHistory())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    const allTasks = Object.values(result.current.tasksByMonth).flat()
    expect(allTasks).toHaveLength(3)
  })

  it("computes aggregate stats", async () => {
    seedStorage()
    const { result } = renderHook(() => useHistory())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.stats.total).toBe(3)
    expect(result.current.stats.totalTime).toBe(3600 + 1800 + 2400)
    expect(result.current.stats.avgSatisfaction).toBeCloseTo((4 + 5 + 3) / 3)
  })

  it("filters tasks by search term (title and description)", async () => {
    seedStorage()
    const { result } = renderHook(() => useHistory())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    act(() => {
      result.current.setSearchTerm("Revisar")
    })

    const filtered = Object.values(result.current.tasksByMonth).flat()
    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe("Revisar Pull Requests")
  })

  it("filters tasks by category", async () => {
    seedStorage()
    const { result } = renderHook(() => useHistory())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    act(() => {
      result.current.setCategoryFilter("study")
    })

    const filtered = Object.values(result.current.tasksByMonth).flat()
    expect(filtered).toHaveLength(1)
    expect(filtered[0].category).toBe("study")
  })

  it("groups tasks by month-year key", async () => {
    seedStorage()
    const { result } = renderHook(() => useHistory())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    // Two tasks in January 2026, one in February 2026
    expect(Object.keys(result.current.tasksByMonth)).toHaveLength(2)
  })

  it("clones a completed task into rumo_tasks as a pending active task", async () => {
    localStorage.setItem("token", "test-token")
    localStorage.setItem("rumo_completed_tasks", JSON.stringify(completedFixtures))
    localStorage.setItem("rumo_tasks", JSON.stringify([]))

    const { result } = renderHook(() => useHistory())

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    const taskToRepeat = Object.values(result.current.tasksByMonth).flat()[0]

    act(() => {
      result.current.handleRepeatTask(taskToRepeat)
    })

    const stored = JSON.parse(localStorage.getItem("rumo_tasks") || "[]")
    expect(stored).toHaveLength(1)
    expect(stored[0].title).toBe(taskToRepeat.title)
    expect(stored[0].status).toBe("pending")
    expect(stored[0].progress).toBe(0)
    expect(stored[0].id).not.toBe(taskToRepeat.id)
  })
})
