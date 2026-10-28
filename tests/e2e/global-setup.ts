import { execSync } from "node:child_process"

/** Some tests change demo data (e.g. mark notifications read), so every run starts from a fresh demo org. */
export default function globalSetup() {
  execSync("pnpm -s db:reset-demo", { stdio: "inherit" })
}
