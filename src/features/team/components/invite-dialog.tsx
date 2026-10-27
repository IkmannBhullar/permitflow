"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, CopyIcon, UserPlusIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { FormError } from "@/components/form/form-error"
import { SelectField } from "@/components/form/select-field"
import { SubmitButton } from "@/components/form/submit-button"
import { TextField } from "@/components/form/text-field"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ORG_ROLES, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/features/orgs/roles"
import { applyServerErrors } from "@/lib/forms"

import { createInvite } from "../actions"
import { inviteSchema, type InviteInput } from "../schemas"

const ROLE_OPTIONS = ORG_ROLES.map((r) => ({
  value: r,
  label: `${ROLE_LABELS[r]}: ${ROLE_DESCRIPTIONS[r]}`,
}))
const DEFAULTS: InviteInput = { email: "", role: "project_manager" }

export function InviteDialog({ orgSlug }: { orgSlug: string }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const form = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: DEFAULTS,
  })

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = await createInvite(orgSlug, values)
      if (!result.ok) {
        setFormError(result.error)
        applyServerErrors(form.setError, result.fieldErrors)
        return
      }
      setLink(result.data.link)
    })
  })

  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success("Invite link copied")
    } catch {
      toast.error("Couldn't copy automatically. Select the link and copy it.")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          form.reset(DEFAULTS)
          setFormError(null)
          setLink(null)
          setCopied(false)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon /> Invite member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{link ? "Share this invite link" : "Invite a teammate"}</DialogTitle>
          <DialogDescription>
            {link
              ? "PermitFlow doesn't send email. Copy this link and send it yourself. It's shown only once and expires in 7 days."
              : "You'll get a link to send them. They sign up or log in with this email to join."}
          </DialogDescription>
        </DialogHeader>
        {link ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={link}
                aria-label="Invite link"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button type="button" variant="outline" onClick={copy}>
                {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-6">
            <FieldGroup>
              <FormError message={formError} />
              <TextField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="name@company.com"
              />
              <SelectField control={form.control} name="role" label="Role" options={ROLE_OPTIONS} />
            </FieldGroup>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <SubmitButton pending={pending}>Create invite link</SubmitButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
