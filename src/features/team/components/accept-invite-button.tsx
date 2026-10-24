"use client"

import { useState, useTransition } from "react"

import { FormError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"

import { acceptInvite } from "../invite-actions"

export function AcceptInviteButton({ token, orgName }: { token: string; orgName: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        setError(null)
        startTransition(async () => {
          const result = await acceptInvite(token)
          if (result && !result.ok) setError(result.error)
        })
      }}
    >
      <FormError message={error} />
      <SubmitButton pending={pending} className="w-full">
        Join {orgName}
      </SubmitButton>
    </form>
  )
}
