import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { Task } from "@/lib/types"

// The global setup mock returns a fresh router/searchParams object per render,
// which makes the hook's `[router]` / `[..., searchParams]` effects loop forever.
// Pin stable instances.
vi.mock("next/navigation", () => {
  const router = { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }
  const params = new URLSearchParams()
  return {
    useRouter: () => router,
    useSearchParams: () => params,
    usePathname: () => "/",
  }
})

// Mock the API layer so the hook's network calls resolve deterministically.
const apiMocks = {
  list: vi.fn(),
  history: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
  clearAll: vi.fn(),
  syncPush: vi.fn(),
  processQueue: vi.fn(),
}

vi.mock("@/lib/api", () => ({
  api: {
    tasks: {
      list: (...a: any[]) => apiMocks.list(...a),
      history: (...a: any[]) => apiMocks.history(...a),
      create: (...a: any[]) => apiMocks.create(...a),
      update: (...a: any[]) => apiMocks.update(...a),
      delete: (...a: any[]) => apiMocks.del(...a),
      clearAll: (...a: any[]) => apiMocks.clearAll(...a),
    },
    sync: {
      push: (...a: any[]) => apiMocks.syncPush(...a),
      processQueue: (...a: any[]) => apiMocks.processQueue(...a),
    },
    categories: { create: vi.fn().mockResolvedValue({}) },
    subtasks: { tick: vi.fn().mockResolvedValue({}) },
    objectives: { attachTask: vi.fn().mockResolvedValue({}) },
  },
}))

import { useDashboard } from "./use-dashboard"

const seedTasks = [
  { id: "seed-1", title: "Seed Task", description: "", category: "work", status: "pending", order: 0, progress: 0 },
]

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })
}

function setupHook() {
  localStorage.setItem("token", "test-token")
  localStorage.setItem("current_user", JSON.stringify({ id: "u1", name: "Test", email: "t@t.com" }))
  return renderHook(() => useDashboard())
}

describe("useDashboard", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    apiMocks.list.mockResolvedValue({ tasks: seedTasks, categories: [], activityCount: 0 })
    apiMocks.history.mockResolvedValue({ tasks: [], hasMore: false })
    apiMocks.create.mockImplementation(async (t: Task) => t)
    apiMocks.update.mockResolvedValue({})
    apiMocks.del.mockResolvedValue(undefined)
    apiMocks.clearAll.mockResolvedValue(undefined)
  })

  it("becomes mounted after the init effect runs", async () => {
    const { result } = setupHook()
    await flush()
    expect(result.current.mounted).toBe(true)
  })

  it("loads tasks from the API", async () => {
    const { result } = setupHook()
    await flush()
    expect(apiMocks.list).toHaveBeenCalled()
    expect(result.current.tasks.some((t: Task) => t.id === "seed-1")).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  it("loads current user from localStorage", async () => {
    const { result } = setupHook()
    await flush()
    expect(result.current.currentUser).toEqual({ id: "u1", name: "Test", email: "t@t.com" })
  })

  it("adds a new task", async () => {
    const { result } = setupHook()
    await flush()

    await act(async () => {
      await result.current.handleAddTask({
        title: "New Task",
        category: "work",
        estimatedTime: 3600,
        difficulty: "medium",
        satisfaction: 3,
        startDate: new Date(),
      })
    })

    expect(result.current.tasks.some((t: Task) => t.title === "New Task")).toBe(true)
    expect(apiMocks.create).toHaveBeenCalled()
  })

  it("starts and pauses a task (status transitions)", async () => {
    const { result } = setupHook()
    await flush()

    await act(async () => {
      await result.current.handleStartTask("seed-1")
    })
    expect(result.current.tasks.find((t: Task) => t.id === "seed-1")?.status).toBe("in-progress")

    await act(async () => {
      await result.current.handlePauseTask("seed-1")
    })
    expect(result.current.tasks.find((t: Task) => t.id === "seed-1")?.status).toBe("paused")
  })

  it("deletes a task", async () => {
    const { result } = setupHook()
    await flush()

    const before = result.current.tasks.length
    await act(async () => {
      await result.current.handleDeleteTask("seed-1")
    })

    expect(result.current.tasks.length).toBe(before - 1)
    expect(result.current.tasks.some((t: Task) => t.id === "seed-1")).toBe(false)
    expect(apiMocks.del).toHaveBeenCalledWith("seed-1")
  })

  it("completes a task: moves it from active to completed", async () => {
    const { result } = setupHook()
    await flush()

    act(() => {
      result.current.handleCompleteTask("seed-1")
    })
    // Task selected for completion modal
    expect(result.current.taskToComplete?.id).toBe("seed-1")

    await act(async () => {
      await result.current.handleCompletionSubmit("medium", 4)
    })

    expect(result.current.tasks.some((t: Task) => t.id === "seed-1")).toBe(false)
    expect(result.current.completedTasks.some((t: Task) => t.id === "seed-1")).toBe(true)
    expect(result.current.activityCount).toBe(1)
  })

  it("logs out, clearing auth and redirecting", async () => {
    const { result } = setupHook()
    await flush()

    act(() => {
      result.current.handleLogout()
    })

    expect(localStorage.getItem("token")).toBeNull()
    expect(localStorage.getItem("current_user")).toBeNull()
  })

  it("clears all tasks", async () => {
    const { result } = setupHook()
    await flush()

    await act(async () => {
      await result.current.handleClearAll()
    })

    expect(result.current.tasks).toHaveLength(0)
    expect(result.current.completedTasks).toHaveLength(0)
    expect(apiMocks.clearAll).toHaveBeenCalled()
  })
})
