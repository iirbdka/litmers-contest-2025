import { NextRequest } from "next/server"
import { CommentForm, CommentVM } from "@/src/schemas/issue"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ issueId: string; commentId: string }> }

// PATCH /api/issues/:issueId/comments/:commentId - Update comment
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId, commentId } = await params
    const { supabase, user } = await requireAuth()
    const body = CommentForm.parse(await req.json())

    // Get comment
    const { data: existingComment, error: commentError } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", commentId)
      .eq("issue_id", issueId)
      .is("deleted_at", null)
      .single()

    if (commentError || !existingComment) {
      return errorResponse("Comment not found", 404)
    }

    // Only author can edit
    if (existingComment.author_id !== user.id) {
      return errorResponse("Forbidden", 403)
    }

    const { data: comment, error } = await supabase
      .from("comments")
      .update({
        content: body.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .select(`
        *,
        author:profiles!inner(id, name, profile_image)
      `)
      .single()

    if (error) throw error

    const author = comment.author as any
    const result = CommentVM.parse({
      id: comment.id,
      issueId: comment.issue_id,
      authorId: comment.author_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: {
        id: author.id,
        name: author.name,
        profileImage: author.profile_image,
      },
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/issues/:issueId/comments/:commentId - Soft delete comment
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId, commentId } = await params
    const { supabase, user } = await requireAuth()

    // Get comment and issue
    const { data: comment, error: commentError } = await supabase
      .from("comments")
      .select(`
        author_id,
        issue:issues!inner(project:projects!inner(team_id))
      `)
      .eq("id", commentId)
      .eq("issue_id", issueId)
      .is("deleted_at", null)
      .single()

    if (commentError || !comment) {
      return errorResponse("Comment not found", 404)
    }

    const issueData = comment.issue as any
    const projectData = issueData.project as any

    // Check if user is author or team admin
    const { data: member } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", projectData.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (!member) {
      return errorResponse("Forbidden", 403)
    }

    const canDelete =
      comment.author_id === user.id ||
      member.role === "OWNER" ||
      member.role === "ADMIN"

    if (!canDelete) {
      return errorResponse("Forbidden", 403)
    }

    const { error } = await supabase
      .from("comments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", commentId)

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

