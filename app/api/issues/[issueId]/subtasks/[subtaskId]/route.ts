import { NextRequest } from "next/server"
import { z } from "zod"
import { Subtask } from "@/src/schemas/issue"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ issueId: string; subtaskId: string }> }

// PATCH /api/issues/:issueId/subtasks/:subtaskId - Update subtask
const UpdateSubtaskBody = z.object({
  title: z.string().min(1).max(200).optional(),
  done: z.boolean().optional(),
  position: z.number().int().optional(),
})

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId, subtaskId } = await params
    const { supabase, user } = await requireAuth()
    const body = UpdateSubtaskBody.parse(await req.json())

    // Verify access
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("project:projects!inner(team_id)")
      .eq("id", issueId)
      .is("deleted_at", null)
      .single()

    if (issueError || !issue) {
      return errorResponse("Issue not found", 404)
    }

    const projectData = issue.project as any

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

    const updates: Record<string, any> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.done !== undefined) updates.done = body.done
    if (body.position !== undefined) updates.position = body.position

    const { data: subtask, error } = await supabase
      .from("subtasks")
      .update(updates)
      .eq("id", subtaskId)
      .eq("issue_id", issueId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error || !subtask) {
      return errorResponse("Subtask not found", 404)
    }

    const result = Subtask.parse({
      id: subtask.id,
      issueId: subtask.issue_id,
      title: subtask.title,
      done: subtask.done,
      position: subtask.position,
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/issues/:issueId/subtasks/:subtaskId - Soft delete subtask
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId, subtaskId } = await params
    const { supabase, user } = await requireAuth()

    // Verify access
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("project:projects!inner(team_id)")
      .eq("id", issueId)
      .is("deleted_at", null)
      .single()

    if (issueError || !issue) {
      return errorResponse("Issue not found", 404)
    }

    const projectData = issue.project as any

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

    const { error } = await supabase
      .from("subtasks")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", subtaskId)
      .eq("issue_id", issueId)

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

