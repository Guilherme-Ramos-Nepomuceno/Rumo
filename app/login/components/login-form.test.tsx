import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { LoginForm } from "./login-form"

describe("LoginForm", () => {
  const mockProps = {
    isLogin: true,
    showPassword: false,
    setShowPassword: vi.fn(),
    error: "",
    formData: { email: "", password: "", name: "", confirmPassword: "" },
    setFormData: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    toggleAuthMode: vi.fn()
  }

  it("renders login state correctly", () => {
    render(<LoginForm {...mockProps} />)
    expect(screen.getByText(/Bem-vindo de volta/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Nome completo/i)).not.toBeInTheDocument()
  })

  it("renders register state correctly", () => {
    render(<LoginForm {...mockProps} isLogin={false} />)
    expect(screen.getByText(/Crie sua conta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Nome completo/i)).toBeInTheDocument()
  })

  it("calls toggleAuthMode when clicking the toggle button", () => {
    render(<LoginForm {...mockProps} />)
    fireEvent.click(screen.getByText(/Cadastre-se/i))
    expect(mockProps.toggleAuthMode).toHaveBeenCalled()
  })

  it("calls onSubmit when form is submitted", () => {
    render(<LoginForm {...mockProps} />)
    fireEvent.submit(screen.getByRole("button", { name: /Entrar/i }))
    expect(mockProps.onSubmit).toHaveBeenCalled()
  })

  it("displays error message if provided", () => {
    render(<LoginForm {...mockProps} error="Erro customizado" />)
    expect(screen.getByText("Erro customizado")).toBeInTheDocument()
  })
})
