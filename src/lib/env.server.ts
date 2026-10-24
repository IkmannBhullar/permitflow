import "server-only"

import { z } from "zod"

/**
 * Server-only secrets. Each getter validates lazily so a missing optional secret
 * (for example the demo password in a fresh checkout) only fails the feature that needs it.
 */
function required(name: string, schema: z.ZodType<string> = z.string().min(1)): string {
  const result = schema.safeParse(process.env[name])
  if (!result.success) {
    throw new Error(`Missing or invalid server environment variable ${name}. See .env.example.`)
  }
  return result.data
}

export const serverEnv = {
  serviceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  cronSecret: () => required("CRON_SECRET", z.string().min(16)),
  demoUserEmail: () => required("DEMO_USER_EMAIL", z.email()),
  demoUserPassword: () => required("DEMO_USER_PASSWORD"),
}
