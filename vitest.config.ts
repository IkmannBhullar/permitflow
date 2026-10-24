import react from "@vitejs/plugin-react"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// Unit tests: pure logic, no database. Fast and runnable in CI without Docker.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
})
