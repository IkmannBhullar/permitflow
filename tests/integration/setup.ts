import { config } from "dotenv"

config({ path: ".env.local", quiet: true })

for (const name of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]) {
  if (!process.env[name]) {
    throw new Error(`${name} is missing. Start Supabase (pnpm db:start) and create .env.local.`)
  }
}
