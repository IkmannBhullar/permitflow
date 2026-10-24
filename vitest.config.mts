import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// Unit tests: pure logic, no database. Fast and runnable in CI without Docker.
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
})
