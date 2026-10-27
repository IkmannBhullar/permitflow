import { MessageSquareIcon } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { OrgRole } from "@/features/orgs/roles"
import { canEdit, isAdmin } from "@/features/orgs/roles"
import { formatDateTime, timeAgo } from "@/lib/dates"
import { initials } from "@/lib/initials"

import type { CommentRow } from "../queries"
import type { CommentEntity } from "../schemas"
import { CommentForm } from "./comment-form"
import { DeleteCommentButton } from "./delete-comment-button"

export function CommentsSection({
  comments,
  orgSlug,
  entityType,
  entityId,
  role,
  userId,
}: {
  comments: CommentRow[]
  orgSlug: string
  entityType: CommentEntity
  entityId: string
  role: OrgRole
  userId: string
}) {
  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquareIcon className="size-4" aria-hidden /> No comments yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => {
            const name = c.author?.full_name ?? "Former member"
            const canDelete = isAdmin(role) || (canEdit(role) && c.author_id === userId)
            return (
              <li key={c.id} className="flex gap-3">
                <Avatar className="size-7">
                  <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{name}</span>
                    <time
                      dateTime={c.created_at}
                      title={formatDateTime(c.created_at)}
                      className="text-xs text-muted-foreground"
                    >
                      {timeAgo(c.created_at)}
                    </time>
                    {canDelete ? (
                      <span className="ml-auto">
                        <DeleteCommentButton orgSlug={orgSlug} commentId={c.id} />
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {canEdit(role) ? (
        <CommentForm orgSlug={orgSlug} entityType={entityType} entityId={entityId} />
      ) : null}
    </div>
  )
}
