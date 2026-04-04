import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { HistoryList } from "./history-list"
import type { Task } from "@/lib/types"

describe("HistoryList", () => {
  const mockTasksByMonth: Record<string, Task[]> = {
    "abril de 2026": [
      {
        id: "1",
        title: "Tarefa Teste",
        description: "Desc",
        category: "work",
        status: "completed",
        progress: 100,
        completedAt: new Date()
      } as any
    ]
  }

  const mockFormatDate = vi.fn(() => "01/04/2026")
  const mockFormatDuration = vi.fn(() => "1h")
  const mockOnRepeat = vi.fn()

  it("renders tasks grouped by month", () => {
    render(
      <HistoryList 
        tasksByMonth={mockTasksByMonth} 
        formatDate={mockFormatDate}
        formatDuration={mockFormatDuration}
        onRepeat={mockOnRepeat}
      />
    )

    expect(screen.getByText("abril de 2026")).toBeInTheDocument()
    expect(screen.getByText("Tarefa Teste")).toBeInTheDocument()
  })

  it("renders empty state correctly", () => {
    render(
      <HistoryList 
        tasksByMonth={{}} 
        formatDate={mockFormatDate}
        formatDuration={mockFormatDuration}
        onRepeat={mockOnRepeat}
      />
    )

    expect(screen.getByText(/Nenhuma tarefa encontrada/i)).toBeInTheDocument()
  })
})
