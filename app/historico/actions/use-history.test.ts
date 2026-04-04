import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useHistory } from "./use-history"
import { mockCompletedTasks } from "@/lib/mock-data"

describe("useHistory", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("should initialize and load tasks from storage if available", async () => {
    localStorage.setItem("auth_token", "test-token")
    const { result } = renderHook(() => useHistory())
    
    await act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    expect(result.current.mounted).toBe(true)
    // Default should load mock data if storage is empty
    expect(result.current.tasksByMonth).toBeDefined()
  })

  it("should filter tasks by search term", async () => {
    localStorage.setItem("auth_token", "test-token")
    const { result } = renderHook(() => useHistory())

    await act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    act(() => {
      result.current.setSearchTerm("Revisar") // Matches "Revisar Pull Requests"
    })

    const monthGroups = Object.values(result.current.tasksByMonth)
    const allFilteredTasks = monthGroups.flat()
    
    expect(allFilteredTasks.every(t => t.title.includes("Revisar"))).toBe(true)
  })

  it("should handle task repetition (cloning to active)", async () => {
    localStorage.setItem("auth_token", "test-token")
    localStorage.setItem("rumo_tasks", JSON.stringify([]))
    
    const { result } = renderHook(() => useHistory())

    await act(async () => {
      await new Promise(r => setTimeout(r, 0))
    })

    const taskToRepeat = mockCompletedTasks[0]

    act(() => {
      result.current.handleRepeatTask(taskToRepeat)
    })

    const storedTasks = JSON.parse(localStorage.getItem("rumo_tasks") || "[]")
    expect(storedTasks.length).toBe(1)
    expect(storedTasks[0].title).toBe(taskToRepeat.title)
    expect(storedTasks[0].status).toBe("pending")
  })
})
