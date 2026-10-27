import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Disclaimer } from "@/components/disclaimer"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OrgSettingsForm } from "@/features/orgs/components/org-settings-form"
import { isAdmin, ROLE_LABELS } from "@/features/orgs/roles"
import { getOrgContext } from "@/lib/actions"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage({ params }: PageProps<"/app/[orgSlug]/settings">) {
  const { orgSlug } = await params
  const ctx = await getOrgContext(orgSlug)
  if (!ctx) notFound()

  return (
    <>
      <PageHeader title="Settings" description="Organization details." />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization</CardTitle>
          <CardDescription>
            {isAdmin(ctx.role)
              ? "Rename your organization or change its URL."
              : `You're a ${ROLE_LABELS[ctx.role].toLowerCase()}. Only admins can change these settings.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin(ctx.role) ? (
            <OrgSettingsForm key={ctx.org.slug} orgSlug={ctx.org.slug} name={ctx.org.name} />
          ) : (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{ctx.org.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">URL</dt>
                <dd className="font-medium">/app/{ctx.org.slug}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">About PermitFlow</CardTitle>
        </CardHeader>
        <CardContent>
          <Disclaimer className="text-sm" />
        </CardContent>
      </Card>
    </>
  )
}
