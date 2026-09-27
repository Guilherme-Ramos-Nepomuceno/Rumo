import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import type React from "react"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useLogin } from "./use-login"
import { api } from "@/lib/api"

vi.mock("@/lib/api", () => ({
  api: {
    auth: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    },
    sync: {
      push: vi.fn(),
    },
  },
}))

describe("useLogin", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("initializes with login mode enabled", () => {
      const { result } = renderHook(() => useLogin())

      expect(result.current.isLogin).toBe(true)
      expect(result.current.error).toBe("")
      expect(result.current.showPassword).toBe(false)
    })

    it("redirects to home if already authenticated", () => {
      localStorage.setItem("token", "existing-token")
      const { result } = renderHook(() => useLogin())

      expect(result.current.mounted).toBe(true)
    })

    it("sets mounted to true on mount", async () => {
      const { result } = renderHook(() => useLogin())

      await waitFor(() => {
        expect(result.current.mounted).toBe(true)
      })
    })
  })

  describe("Form State", () => {
    it("toggles password visibility", () => {
      const { result } = renderHook(() => useLogin())

      expect(result.current.showPassword).toBe(false)

      act(() => {
        result.current.setShowPassword(true)
      })

      expect(result.current.showPassword).toBe(true)
    })

    it("updates form data correctly", () => {
      const { result } = renderHook(() => useLogin())

      const newFormData = {
        name: "John",
        email: "john@example.com",
        password: "password123",
        confirmPassword: "password123",
      }

      act(() => {
        result.current.setFormData(newFormData)
      })

      expect(result.current.formData).toEqual(newFormData)
    })

    it("toggles between login and register modes", () => {
      const { result } = renderHook(() => useLogin())

      expect(result.current.isLogin).toBe(true)

      act(() => {
        result.current.toggleAuthMode()
      })

      expect(result.current.isLogin).toBe(false)
      expect(result.current.error).toBe("")
      expect(result.current.formData.email).toBe("")
    })

    it("clears form when toggling auth mode", () => {
      const { result } = renderHook(() => useLogin())

      act(() => {
        result.current.setFormData({
          name: "John",
          email: "john@example.com",
          password: "password123",
          confirmPassword: "password123",
        })
      })

      act(() => {
        result.current.toggleAuthMode()
      })

      expect(result.current.formData.email).toBe("")
      expect(result.current.formData.password).toBe("")
    })
  })

  describe("Registration", () => {
    it("validates password match", () => {
      const { result } = renderHook(() => useLogin())

      act(() => {
        result.current.toggleAuthMode()
      })

      act(() => {
        result.current.setFormData({
          name: "John",
          email: "john@example.com",
          password: "password123",
          confirmPassword: "different",
        })
      })

      const event = new Event("submit")
      event.preventDefault = vi.fn()

      act(() => {
        result.current.handleSubmit(event as unknown as React.FormEvent)
      })

      expect(result.current.error).toBe("As senhas não coincidem")
    })

    it("validates password length", () => {
      const { result } = renderHook(() => useLogin())

      act(() => {
        result.current.toggleAuthMode()
      })

      act(() => {
        result.current.setFormData({
          name: "John",
          email: "john@example.com",
          password: "short",
          confirmPassword: "short",
        })
      })

      const event = new Event("submit")
      event.preventDefault = vi.fn()

      act(() => {
        result.current.handleSubmit(event as unknown as React.FormEvent)
      })

      expect(result.current.error).toBe("A senha deve ter pelo menos 6 caracteres")
    })
  })
})
