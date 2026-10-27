import { z } from "zod"

export const COMMENT_ENTITIES = ["project", "permit", "task"] as const
export type CommentEntity = (typeof COMMENT_ENTITIES)[number]

export const addCommentSchema = z.object({
  entity_type: z.enum(COMMENT_ENTITIES),
  entity_id: z.uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Write a comment first.")
    .max(5000, "Keep comments under 5,000 characters."),
})
export type AddCommentInput = z.input<typeof addCommentSchema>

export const deleteCommentSchema = z.object({ id: z.uuid() })
