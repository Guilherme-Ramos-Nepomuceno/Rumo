import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { HistoryStats } from "./history-stats"

describe("HistoryStats", () => {
  const mockStats = {
    total: 10,
    totalTime: 3600,
    avgSatisfaction: 4.5
  }

  const mockFormatDuration = vi.fn((s) => "1h 0m")

  it("renders correctly with given stats", () => {
    render(<HistoryStats stats={mockStats} formatDuration={mockFormatDuration} />)

    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("1h 0m")).toBeInTheDocument()
    expect(screen.getByText("4.5/5")).toBeInTheDocument()
  })

  it("calls formatDuration with totalTime", () => {
    render(<HistoryStats stats={mockStats} formatDuration={mockFormatDuration} />)
    expect(mockFormatDuration).toHaveBeenCalledWith(3600)
  })
})
