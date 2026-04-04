import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useDashboard } from "./use-dashboard"
import type { Task } from "@/lib/types"

describe("useDashboard", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("should initialize with mounted false then true", async () => {
    const { result } = renderHook(() => useDashboard())
    
    expect(result.current.mounted).toBe(false)
    
    await act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })
    
    expect(result.current.mounted).toBe(true)
  })

  it("should handle adding a new task", async () => {
    localStorage.setItem("auth_token", "test-token")
    const { result } = renderHook(() => useDashboard())

    await act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    const newTaskData = {
      title: "New Task",
      category: "work" as const,
      estimatedTime: 3600,
      difficulty: "medium" as const,
      satisfaction: 3,
      startDate: new Date(),
    }

    act(() => {
      result.current.handleAddTask(newTaskData)
    })

    expect(result.current.tasks.some((t: Task) => t.title === "New Task")).toBe(true)
  })

  it("should transition task status", async () => {
    localStorage.setItem("auth_token", "test-token")
    const { result } = renderHook(() => useDashboard())

    await act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    // If no tasks, it uses mockTasks. Let's find one.
    const firstTask = result.current.tasks[0]
    if (!firstTask) return

    act(() => {
      result.current.handleStartTask(firstTask.id)
    })

    expect(result.current.tasks.find((t: Task) => t.id === firstTask.id)?.status).toBe("in-progress")

    act(() => {
      result.current.handlePauseTask(firstTask.id)
    })

    expect(result.current.tasks.find((t: Task) => t.id === firstTask.id)?.status).toBe("paused")
  })

  it("should handle task deletion", async () => {
    localStorage.setItem("auth_token", "test-token")
    const { result } = renderHook(() => useDashboard())

    await act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    const initialCount = result.current.tasks.length
    const taskToDelete = result.current.tasks[0]
    if (!taskToDelete) return

    act(() => {
      result.current.handleDeleteTask(taskToDelete.id)
    })

    expect(result.current.tasks.length).toBe(initialCount - 1)
    expect(result.current.tasks.some((t: Task) => t.id === taskToDelete.id)).toBe(false)
  })
})
