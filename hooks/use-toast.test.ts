import { describe, it, expect } from "vitest"
import { reducer } from "./use-toast"

const toast = (id: string, extra: Record<string, any> = {}) => ({
  id,
  title: `Toast ${id}`,
  open: true,
  ...extra,
})

describe("use-toast reducer", () => {
  it("ADD_TOAST adds a toast", () => {
    const state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast: toast("1") } as any)
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0].id).toBe("1")
  })

  it("ADD_TOAST respects the toast limit (newest first)", () => {
    let state = reducer({ toasts: [] }, { type: "ADD_TOAST", toast: toast("1") } as any)
    state = reducer(state, { type: "ADD_TOAST", toast: toast("2") } as any)
    // TOAST_LIMIT is 1 — only the newest survives
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0].id).toBe("2")
  })

  it("UPDATE_TOAST merges fields into the matching toast", () => {
    const start = { toasts: [toast("1")] }
    const state = reducer(start, {
      type: "UPDATE_TOAST",
      toast: { id: "1", title: "Updated" },
    } as any)
    expect(state.toasts[0].title).toBe("Updated")
  })

  it("UPDATE_TOAST leaves non-matching toasts untouched", () => {
    const start = { toasts: [toast("1")] }
    const state = reducer(start, {
      type: "UPDATE_TOAST",
      toast: { id: "999", title: "Nope" },
    } as any)
    expect(state.toasts[0].title).toBe("Toast 1")
  })

  it("DISMISS_TOAST marks a specific toast as closed", () => {
    const start = { toasts: [toast("1")] }
    const state = reducer(start, { type: "DISMISS_TOAST", toastId: "1" } as any)
    expect(state.toasts[0].open).toBe(false)
  })

  it("DISMISS_TOAST without an id closes all toasts", () => {
    const start = { toasts: [toast("1"), toast("2")] }
    const state = reducer(start, { type: "DISMISS_TOAST" } as any)
    expect(state.toasts.every((t) => t.open === false)).toBe(true)
  })

  it("REMOVE_TOAST removes a specific toast", () => {
    const start = { toasts: [toast("1"), toast("2")] }
    const state = reducer(start, { type: "REMOVE_TOAST", toastId: "1" } as any)
    expect(state.toasts).toHaveLength(1)
    expect(state.toasts[0].id).toBe("2")
  })

  it("REMOVE_TOAST without an id clears every toast", () => {
    const start = { toasts: [toast("1"), toast("2")] }
    const state = reducer(start, { type: "REMOVE_TOAST" } as any)
    expect(state.toasts).toHaveLength(0)
  })
})
