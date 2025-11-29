"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Send, Loader2, MoreHorizontal, Edit, Trash2, Sparkles, X, Check } from "lucide-react"

import { CommentForm, type CommentFormType, type CommentVMType } from "@/src/schemas/issue"
import { LIMITS, validateAICommentSummary } from "@/src/schemas/validators"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCreateComment, useDeleteComment } from "@/hooks/use-issues"
import { useCurrentUser } from "@/hooks/use-auth"
import { api } from "@/lib/api/client"

interface CommentSectionProps {
  comments: CommentVMType[]
  issueId: string
  onUpdate: () => void
}

export function CommentSection({ comments, issueId, onUpdate }: CommentSectionProps) {
  const { data: currentUser } = useCurrentUser()
  const { trigger: createComment, isMutating: isCreating } = useCreateComment(issueId)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [displayCount, setDisplayCount] = useState(5)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [isEditSaving, setIsEditSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormType>({
    resolver: zodResolver(CommentForm),
  })

  const handleAdd = async (data: CommentFormType) => {
    try {
      await createComment({ content: data.content })
      reset()
      onUpdate()
    } catch (err) {
      console.error("Failed to create comment:", err)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return
    setIsEditSaving(true)
    try {
      await api.patch(`/issues/${issueId}/comments/${id}`, { content: editContent.trim() })
      onUpdate()
      setEditingId(null)
      setEditContent("")
    } catch (err) {
      console.error("Failed to update comment:", err)
    } finally {
      setIsEditSaving(false)
    }
  }

  const startEditing = (comment: CommentVMType) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent("")
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.delete(`/issues/${issueId}/comments/${id}`)
      onUpdate()
    } catch (err) {
      console.error("Failed to delete comment:", err)
    } finally {
      setDeletingId(null)
    }
  }

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    setDisplayCount((prev) => prev + 5)
    setIsLoadingMore(false)
  }, [])

  const displayedComments = comments.slice(0, displayCount)
  const hasMore = displayCount < comments.length
  const canShowAISummary = validateAICommentSummary(comments.length)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">댓글 ({comments.length})</CardTitle>
        {canShowAISummary && (
          <Button variant="outline" size="sm">
            <Sparkles className="mr-2 h-4 w-4" />
            AI 요약
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment List */}
        <div className="space-y-4">
          {displayedComments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.profileImage || undefined} />
                <AvatarFallback className="text-xs">{comment.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                    {comment.updatedAt && <span className="text-xs text-muted-foreground">(수정됨)</span>}
                  </div>
                  {comment.authorId === currentUser?.id && editingId !== comment.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={deletingId === comment.id}>
                          {deletingId === comment.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditing(comment)}>
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(comment.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {editingId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      rows={3}
                      disabled={isEditSaving}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={isEditSaving}
                      >
                        <X className="mr-1 h-4 w-4" />
                        취소
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEdit(comment.id)}
                        disabled={isEditSaving || !editContent.trim()}
                      >
                        {isEditSaving ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-1 h-4 w-4" />
                        )}
                        저장
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="text-center">
            <Button variant="ghost" onClick={loadMore} disabled={isLoadingMore}>
              {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              이전 댓글 보기 ({comments.length - displayCount}개 더)
            </Button>
          </div>
        )}

        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">아직 댓글이 없습니다</p>
        )}

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit(handleAdd)} className="flex gap-3 pt-4 border-t">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser?.profileImage || undefined} />
            <AvatarFallback className="text-xs">{currentUser?.name?.charAt(0) || "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea placeholder="댓글을 입력하세요..." rows={2} {...register("content")} disabled={isCreating} />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">최대 {LIMITS.COMMENT_CONTENT_MAX}자</span>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    작성
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
