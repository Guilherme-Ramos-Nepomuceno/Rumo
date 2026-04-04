import { expect, vi } from "vitest"
import "@testing-library/jest-dom/vitest"
import React from "react"

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}))

// Mock LocalStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Global mock for framer-motion to prevent transformation errors
vi.mock("framer-motion", () => {
  const React = require("react")
  const motionProxy = new Proxy(
    {},
    {
      get: (_target, key) => {
        return React.forwardRef(({ children, ...props }: any, ref: any) => {
          const Tag = typeof key === "string" ? key : "div"
          return React.createElement(Tag, { ...props, ref }, children)
        })
      },
    }
  )
  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: any) => children,
    useAnimation: () => ({ start: () => Promise.resolve() }),
    useMotionValue: (initial: any) => ({ get: () => initial, set: () => {} }),
    useTransform: (value: any) => value,
  }
})
