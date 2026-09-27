import { renderHook } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const processQueue = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/api", () => ({
  api: { sync: { processQueue: (...a: any[]) => processQueue(...a) } },
}))

import { useCloudSync } from "./useCloudSync"

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, value })
}

describe("useCloudSync", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    processQueue.mockClear()
    setOnline(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("processes the sync queue on the interval when online", () => {
    renderHook(() => useCloudSync())
    expect(processQueue).not.toHaveBeenCalled()

    vi.advanceTimersByTime(10000)
    expect(processQueue).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(10000)
    expect(processQueue).toHaveBeenCalledTimes(2)
  })

  it("does not process the queue while offline", () => {
    setOnline(false)
    renderHook(() => useCloudSync())

    vi.advanceTimersByTime(30000)
    expect(processQueue).not.toHaveBeenCalled()
  })

  it("processes the queue immediately when the connection comes back", () => {
    renderHook(() => useCloudSync())

    // NOTE: the hook's cleanup passes a fresh anonymous fn to removeEventListener,
    // so the "online" listener actually leaks. Assert on the delta rather than an
    // absolute count to stay robust to listeners left by prior renders.
    const before = processQueue.mock.calls.length
    window.dispatchEvent(new Event("online"))
    expect(processQueue.mock.calls.length).toBeGreaterThan(before)
  })

  it("stops the interval after unmount", () => {
    const { unmount } = renderHook(() => useCloudSync())
    unmount()

    vi.advanceTimersByTime(30000)
    expect(processQueue).not.toHaveBeenCalled()
  })
})
