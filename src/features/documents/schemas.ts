import { z } from "zod"

import { MAX_FILE_BYTES } from "./files"

export const prepareUploadSchema = z.object({
  projectId: z.uuid(),
  permitId: z.uuid().nullable(),
  /** Set when uploading a new version of an existing document. */
  documentId: z.uuid().nullable(),
  fileName: z.string().trim().min(1).max(255),
  size: z.number().int().positive().max(MAX_FILE_BYTES, "Files can be at most 25 MB."),
  mimeType: z.string().min(1).max(200),
})
export type PrepareUploadInput = z.input<typeof prepareUploadSchema>

export const finalizeUploadSchema = z.object({
  projectId: z.uuid(),
  permitId: z.uuid().nullable(),
  documentId: z.uuid(),
  version: z.number().int().min(1),
  path: z.string().min(1).max(500),
  name: z.string().trim().min(1, "Give the document a name.").max(200),
})
export type FinalizeUploadInput = z.input<typeof finalizeUploadSchema>

export const documentUrlSchema = z.object({ versionId: z.uuid(), download: z.boolean() })
export const deleteDocumentSchema = z.object({ id: z.uuid() })
