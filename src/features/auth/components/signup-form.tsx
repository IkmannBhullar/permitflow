"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MailCheckIcon } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { FormError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { FieldGroup } from "@/components/ui/field"
import { applyServerErrors } from "@/lib/forms"

import { signup } from "../actions"
import { signupSchema, type SignupInput } from "../schemas"

export function SignupForm({ next, email }: { next?: string; email?: string }) {
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: email ?? "", password: "" },
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = await signup(values, next)
      if (!result) return
      if (!result.ok) {
        setFormError(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
      } else if (result.data.needsConfirmation) {
        setSentTo(values.email)
      }
    })
  })

  if (sentTo) {
    return (
      <div className="space-y-3 text-center" role="status">
        <MailCheckIcon className="mx-auto size-8 text-muted-foreground" aria-hidden />
        <p className="font-medium">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to {sentTo}. Open it to finish creating your account.
        </p>
      </div>
    )
  }

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login"

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FieldGroup>
        <FormError message={formError} />
        <TextField control={form.control} name="fullName" label="Full name" autoComplete="name" />
        <TextField
          control={form.control}
          name="email"
          label="Work email"
          type="email"
          autoComplete="email"
        />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 8 characters."
        />
      </FieldGroup>
      <SubmitButton pending={pending} className="w-full">
        Create account
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  )
}
