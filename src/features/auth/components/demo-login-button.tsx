"use client"

import { PlayIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { SubmitButton } from "@/components/form/submit-button"
import type { Button } from "@/components/ui/button"

import { demoLogin } from "../actions"

export function DemoLoginButton(
  props: Omit<React.ComponentProps<typeof Button>, "type" | "onClick">
) {
  const [pending, startTransition] = useTransition()
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        startTransition(async () => {
          const result = await demoLogin()
          if (result && !result.ok) toast.error(result.error)
        })
      }}
    >
      <SubmitButton pending={pending} {...props}>
        {pending ? null : <PlayIcon />} Try the demo
      </SubmitButton>
    </form>
  )
}
