"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"

import { FormError } from "@/components/form/form-error"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { FieldGroup } from "@/components/ui/field"
import { applyServerErrors } from "@/lib/forms"

import { login } from "../actions"
import { loginSchema, type LoginInput } from "../schemas"

export function LoginForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = await login(values, next)
      if (result && !result.ok) {
        setFormError(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
      }
    })
  })

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FieldGroup>
        <FormError message={formError} />
        <TextField
          control={form.control}
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <TextField
          control={form.control}
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
        />
      </FieldGroup>
      <SubmitButton pending={pending} className="w-full">
        Log in
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        New to PermitFlow?{" "}
        <Link
          href={signupHref}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  )
}
