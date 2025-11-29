import { NextRequest } from "next/server"
import { z } from "zod"
import { IssueDetailVM, IssueCreateForm, Label, Subtask, CommentVM, IssueHistoryItemVM } from "@/src/schemas"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ issueId: string }> }

// GET /api/issues/:issueId - Get issue details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params
    const { supabase, user } = await requireAuth()

    // Get issue with related data
    const { data: issue, error } = await supabase
      .from("issues")
      .select(`
        *,
        status:project_statuses!inner(id, name, color),
        assignee:profiles!issues_assignee_user_id_fkey(id, name, profile_image),
        owner:profiles!issues_owner_id_fkey(id, name, profile_image),
        project:projects!inner(team_id)
      `)
      .eq("id", issueId)
      .is("deleted_at", null)
      .single()

    if (error || !issue) {
      return errorResponse("Issue not found", 404)
    }

    const projectData = issue.project as any

    // Verify team membership
    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", projectData.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (!member) {
      return errorResponse("Forbidden", 403)
    }

    // Get related data
    const [
      labelsResult,
      subtasksResult,
      commentsResult,
      historyResult,
    ] = await Promise.all([
      supabase
        .from("issue_labels")
        .select("label:labels(*)")
        .eq("issue_id", issueId),
      supabase
        .from("subtasks")
        .select("*")
        .eq("issue_id", issueId)
        .is("deleted_at", null)
        .order("position"),
      supabase
        .from("comments")
        .select(`
          *,
          author:profiles!inner(id, name, profile_image)
        `)
        .eq("issue_id", issueId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true }),
      supabase
        .from("issue_history")
        .select(`
          *,
          changer:profiles!inner(id, name, profile_image)
        `)
        .eq("issue_id", issueId)
        .order("changed_at", { ascending: false }),
    ])

    const statusData = issue.status as any
    const assignee = issue.assignee as any
    const owner = issue.owner as any
    const labels = (labelsResult.data || [])
      .filter((l: any) => l.label)
      .map((l: any) =>
        Label.parse({
          id: l.label.id,
          projectId: l.label.project_id,
          name: l.label.name,
          color: l.label.color,
        })
      )

    const subtasks = (subtasksResult.data || []).map((s) =>
      Subtask.parse({
        id: s.id,
        issueId: s.issue_id,
        title: s.title,
        done: s.done,
        position: s.position,
      })
    )

    const comments = (commentsResult.data || []).map((c) => {
      const author = c.author as any
      return CommentVM.parse({
        id: c.id,
        issueId: c.issue_id,
        authorId: c.author_id,
        content: c.content,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        author: {
          id: author.id,
          name: author.name,
          profileImage: author.profile_image,
        },
      })
    })

    const history = (historyResult.data || []).map((h) => {
      const changer = h.changer as any
      return IssueHistoryItemVM.parse({
        id: h.id,
        issueId: h.issue_id,
        field: h.field,
        oldValue: h.old_value,
        newValue: h.new_value,
        changedBy: h.changed_by,
        changedAt: h.changed_at,
        changer: {
          id: changer.id,
          name: changer.name,
          profileImage: changer.profile_image,
        },
      })
    })

    const result = IssueDetailVM.parse({
      id: issue.id,
      projectId: issue.project_id,
      ownerId: issue.owner_id,
      title: issue.title,
      description: issue.description,
      status: statusData?.name || "Backlog",
      priority: issue.priority,
      assigneeUserId: issue.assignee_user_id,
      dueDate: issue.due_date,
      labelIds: labels.map((l) => l.id),
      position: issue.position,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      deletedAt: issue.deleted_at,
      ai: {
        summary: issue.ai_summary,
        suggestion: issue.ai_suggestion,
        commentSummary: issue.ai_comment_summary,
      },
      assignee: assignee
        ? {
            id: assignee.id,
            name: assignee.name,
            profileImage: assignee.profile_image,
          }
        : null,
      labels,
      subtaskCount: subtasks.length,
      completedSubtaskCount: subtasks.filter((s) => s.done).length,
      commentCount: comments.length,
      subtasks,
      comments,
      history,
      owner: {
        id: owner.id,
        name: owner.name,
        profileImage: owner.profile_image,
      },
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/issues/:issueId - Update issue
const UpdateIssueBody = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  assigneeUserId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime({ offset: true }).nullable().optional(),
  labelIds: z.array(z.string().uuid()).max(5).optional(),
  position: z.number().int().optional(),
})

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params
    const { supabase, user } = await requireAuth()
    const body = UpdateIssueBody.parse(await req.json())

    // Get issue
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("*, project:projects!inner(team_id)")
      .eq("id", issueId)
      .is("deleted_at", null)
      .single()

    if (issueError || !issue) {
      return errorResponse("Issue not found", 404)
    }

    const projectData = issue.project as any

    // Verify team membership
    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", projectData.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (!member) {
      return errorResponse("Forbidden", 403)
    }

    // Build update object
    const updates: Record<string, any> = {}

    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.assigneeUserId !== undefined) updates.assignee_user_id = body.assigneeUserId
    if (body.dueDate !== undefined) updates.due_date = body.dueDate
    if (body.position !== undefined) updates.position = body.position

    // Handle status change
    if (body.status !== undefined) {
      const { data: statusRow } = await supabase
        .from("project_statuses")
        .select("id")
        .eq("project_id", issue.project_id)
        .eq("name", body.status)
        .single()

      if (statusRow) {
        updates.status_id = statusRow.id
      }
    }

    // Update issue (trigger will handle history)
    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("issues")
        .update(updates)
        .eq("id", issueId)

      if (error) throw error
    }

    // Handle labels
    if (body.labelIds !== undefined) {
      // Get current labels
      const { data: currentLabels } = await supabase
        .from("issue_labels")
        .select("label_id")
        .eq("issue_id", issueId)

      const currentLabelIds = (currentLabels || []).map((l) => l.label_id)
      const newLabelIds = body.labelIds

      // Remove labels not in new list
      const toRemove = currentLabelIds.filter((id) => !newLabelIds.includes(id))
      if (toRemove.length > 0) {
        await supabase
          .from("issue_labels")
          .delete()
          .eq("issue_id", issueId)
          .in("label_id", toRemove)
      }

      // Add new labels
      const toAdd = newLabelIds.filter((id) => !currentLabelIds.includes(id))
      if (toAdd.length > 0) {
        await supabase.from("issue_labels").insert(
          toAdd.map((labelId) => ({
            issue_id: issueId,
            label_id: labelId,
          }))
        )
      }

      // Track label changes in history
      if (toRemove.length > 0 || toAdd.length > 0) {
        await supabase.from("issue_history").insert({
          issue_id: issueId,
          field: "labels",
          old_value: currentLabelIds,
          new_value: newLabelIds,
          changed_by: user.id,
        })
      }
    }

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/issues/:issueId - Soft delete issue
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params
    const { supabase, user } = await requireAuth()

    // Get issue to verify ownership and permissions
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("owner_id, project:projects!inner(team_id)")
      .eq("id", issueId)
      .is("deleted_at", null)
      .single()

    if (issueError || !issue) {
      return errorResponse("Issue not found", 404)
    }

    const projectData = issue.project as any

    // Verify team membership and permission
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

    // Only issue owner or team admin can delete
    const canDelete =
      issue.owner_id === user.id ||
      member.role === "OWNER" ||
      member.role === "ADMIN"

    if (!canDelete) {
      return errorResponse("Forbidden", 403)
    }

    // Soft delete the issue using the SECURITY DEFINER function
    const { data: deleted, error } = await supabase.rpc('soft_delete_issue', {
      issue_uuid: issueId
    })

    if (error) {
      throw error
    }

    if (!deleted) {
      return errorResponse("Issue not found or already deleted", 404)
    }

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

