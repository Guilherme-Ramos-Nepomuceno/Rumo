import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DashboardHeader } from "./dashboard-header"

describe("DashboardHeader", () => {
  const mockUser = { name: "Guilherme", email: "test@example.com" }
  const mockHandlers = {
    onLogout: vi.fn(),
    onOpenNewTask: vi.fn(),
    onOpenCategories: vi.fn(),
  }

  it("renders correctly with user name", () => {
    render(<DashboardHeader currentUser={mockUser} {...mockHandlers} />)
    expect(screen.getByText(/Guilherme/i)).toBeInTheDocument()
  })

  it("renders greeting correctly", () => {
    render(<DashboardHeader currentUser={mockUser} {...mockHandlers} />)
    expect(screen.getByText(/Olá, Guilherme/i)).toBeInTheDocument()
  })

  it("contains Action buttons", () => {
    render(<DashboardHeader currentUser={mockUser} {...mockHandlers} />)
    expect(screen.getByText(/Nova Tarefa/i)).toBeInTheDocument()
  })
})
