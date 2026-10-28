"use client"

import { UploadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useId, useState, useTransition } from "react"
import { toast } from "sonner"

import { FormError } from "@/components/form/form-error"
import type { SelectOption } from "@/components/form/select-field"
import { SubmitButton } from "@/components/form/submit-button"
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

import { finalizeUpload, prepareUpload } from "../actions"
import { ACCEPT_ATTRIBUTE, formatBytes, nameFromFile, validateFile } from "../files"

const NONE = "__none__"

type Props = {
  orgSlug: string
  trigger?: React.ReactNode
} & (
  | {
      /** New document. Pass a fixed project, or a list to choose from. */
      mode: "new"
      projects: SelectOption[]
      /** permit options per project id */
      permitsByProject: Record<string, SelectOption[]>
      defaultProjectId?: string
      defaultPermitId?: string | null
    }
  | {
      mode: "version"
      documentId: string
      documentName: string
      projectId: string
      permitId: string | null
    }
)

export function UploadDocumentDialog(props: Props) {
  const router = useRouter()
  const ids = { file: useId(), name: useId(), project: useId(), permit: useId() }
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [stage, setStage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [nameEdited, setNameEdited] = useState(false)
  const [projectId, setProjectId] = useState(
    props.mode === "new" ? (props.defaultProjectId ?? "") : props.projectId
  )
  const [permitId, setPermitId] = useState<string | null>(
    props.mode === "new" ? (props.defaultPermitId ?? null) : props.permitId
  )

  const reset = () => {
    setFile(null)
    setName("")
    setNameEdited(false)
    setError(null)
    setStage(null)
    if (props.mode === "new") {
      setProjectId(props.defaultProjectId ?? "")
      setPermitId(props.defaultPermitId ?? null)
    }
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!file) return setError("Choose a file to upload.")
    const invalid = validateFile(file)
    if (invalid) return setError(invalid)
    if (!projectId) return setError("Choose a project.")
    const docName = props.mode === "version" ? props.documentName : name.trim()
    if (!docName) return setError("Give the document a name.")

    startTransition(async () => {
      setStage("Preparing upload…")
      const prepared = await prepareUpload(props.orgSlug, {
        projectId,
        permitId,
        documentId: props.mode === "version" ? props.documentId : null,
        fileName: file.name,
        size: file.size,
        mimeType: file.type,
      })
      if (!prepared.ok) {
        setStage(null)
        return setError(prepared.error)
      }

      setStage(`Uploading ${formatBytes(file.size)}…`)
      const { error: uploadError } = await createClient()
        .storage.from("documents")
        .uploadToSignedUrl(prepared.data.path, prepared.data.token, file, {
          contentType: file.type,
        })
      if (uploadError) {
        setStage(null)
        return setError("The upload failed. Check your connection and try again.")
      }

      setStage("Saving…")
      const finalized = await finalizeUpload(props.orgSlug, {
        projectId,
        permitId,
        documentId: prepared.data.documentId,
        version: prepared.data.version,
        path: prepared.data.path,
        name: docName,
      })
      setStage(null)
      if (!finalized.ok) return setError(finalized.error)

      toast.success(
        props.mode === "version" ? `Version ${prepared.data.version} uploaded` : "Document uploaded"
      )
      setOpen(false)
      if (props.mode === "version") router.refresh()
    })
  }

  const permitOptions = props.mode === "new" ? (props.permitsByProject[projectId] ?? []) : []

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setOpen(next)
        if (next) reset()
      }}
    >
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button size="sm" variant="outline">
            <UploadIcon /> {props.mode === "version" ? "Upload new version" : "Upload document"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {props.mode === "version" ? `New version of ${props.documentName}` : "Upload document"}
          </DialogTitle>
          <DialogDescription>
            PDF, images, Word, Excel, PowerPoint, text or CSV. Up to 25 MB.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-6">
          <FieldGroup>
            <FormError message={error} />
            <Field>
              <FieldLabel htmlFor={ids.file}>File</FieldLabel>
              <Input
                id={ids.file}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                disabled={pending}
                onChange={(e) => {
                  const next = e.target.files?.[0] ?? null
                  const invalid = next ? validateFile(next) : null
                  setFile(next)
                  setError(invalid)
                  // Suggest a name from each valid file until the user types their own.
                  if (next && !invalid && props.mode === "new" && !nameEdited)
                    setName(nameFromFile(next.name))
                }}
              />
              {file ? (
                <FieldDescription>{`${file.name} · ${formatBytes(file.size)}`}</FieldDescription>
              ) : null}
            </Field>
            {props.mode === "new" ? (
              <>
                <Field>
                  <FieldLabel htmlFor={ids.name}>Document name</FieldLabel>
                  <Input
                    id={ids.name}
                    value={name}
                    maxLength={200}
                    disabled={pending}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                {props.projects.length > 1 ? (
                  <Field>
                    <FieldLabel htmlFor={ids.project}>Project</FieldLabel>
                    <Select
                      value={projectId || undefined}
                      onValueChange={(v) => {
                        setProjectId(v)
                        setPermitId(null)
                      }}
                    >
                      <SelectTrigger id={ids.project} className="w-full">
                        <SelectValue placeholder="Choose a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {props.projects.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}
                <Field>
                  <FieldLabel htmlFor={ids.permit}>Linked permit</FieldLabel>
                  <Select
                    value={permitId ?? NONE}
                    onValueChange={(v) => setPermitId(v === NONE ? null : v)}
                    disabled={!projectId}
                  >
                    <SelectTrigger id={ids.permit} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No permit (project document)</SelectItem>
                      {permitOptions.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </>
            ) : null}
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <SubmitButton pending={pending}>{stage ?? "Upload"}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
