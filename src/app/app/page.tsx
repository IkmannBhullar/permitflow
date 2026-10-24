import { redirect } from "next/navigation"

import { listMyOrgs } from "@/features/orgs/queries"

/** Sends signed-in users to their first organization, or to onboarding if they have none. */
export default async function AppIndexPage() {
  const orgs = await listMyOrgs()
  if (orgs.length === 0) redirect("/onboarding")
  redirect(`/app/${orgs[0]!.slug}/dashboard`)
}
