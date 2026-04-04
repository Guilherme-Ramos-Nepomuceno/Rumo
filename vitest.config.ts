import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.tsx"],
    alias: {
      "@": path.resolve(__dirname, "./"),
      "framer-motion": path.resolve(__dirname, "test/mocks/framer-motion.tsx")
    }
  }
})
