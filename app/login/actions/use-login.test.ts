import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useLogin } from "./use-login"

describe("useLogin", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("should initialize correctly", () => {
    const { result } = renderHook(() => useLogin())
    expect(result.current.isLogin).toBe(true)
    expect(result.current.error).toBe("")
  })

  it("should toggle between login and register", () => {
    const { result } = renderHook(() => useLogin())

    act(() => {
      result.current.toggleAuthMode()
    })

    expect(result.current.isLogin).toBe(false)

    act(() => {
      result.current.toggleAuthMode()
    })

    expect(result.current.isLogin).toBe(true)
  })

  it("should handle successful registration and login", async () => {
    const { result } = renderHook(() => useLogin())

    // Switch to register
    act(() => {
      result.current.toggleAuthMode()
    })

    const newUser = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123"
    }

    act(() => {
      result.current.setFormData(newUser)
    })

    // Create event mock
    const event = { preventDefault: vi.fn() } as any

    act(() => {
      result.current.handleSubmit(event)
    })

    expect(localStorage.getItem("auth_token")).toBeDefined()
    expect(localStorage.getItem("current_user")).toContain("test@example.com")
  })

  it("should show error on wrong login", async () => {
    const { result } = renderHook(() => useLogin())

    act(() => {
      result.current.setFormData({
        name: "",
        email: "wrong@example.com",
        password: "wrong",
        confirmPassword: ""
      })
    })

    const event = { preventDefault: vi.fn() } as any

    act(() => {
      result.current.handleSubmit(event)
    })

    expect(result.current.error).toBe("Email ou senha incorretos")
  })
})
