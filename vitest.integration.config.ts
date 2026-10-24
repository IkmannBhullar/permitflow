import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"

// Integration tests: run against the local Supabase stack (`pnpm db:start`).
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["tests/integration/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/integration/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    fileParallelism: false,
  },
})
