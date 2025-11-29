import { NextRequest } from "next/server"
import { Subtask, SubtaskForm } from "@/src/schemas/issue"
import { LIMITS } from "@/src/schemas/validators"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ issueId: string }> }

// GET /api/issues/:issueId/subtasks - List subtasks
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params
    const { supabase, user } = await requireAuth()

    // Verify access through issue -> project -> team
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

    const { data: subtasks, error } = await supabase
      .from("subtasks")
      .select("*")
      .eq("issue_id", issueId)
      .is("deleted_at", null)
      .order("position")

    if (error) throw error

    const result = (subtasks || []).map((s) =>
      Subtask.parse({
        id: s.id,
        issueId: s.issue_id,
        title: s.title,
        done: s.done,
        position: s.position,
      })
    )

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/issues/:issueId/subtasks - Create subtask
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params
    const { supabase, user } = await requireAuth()
    const body = SubtaskForm.parse(await req.json())

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

    // Check subtask limit
    const { count } = await supabase
      .from("subtasks")
      .select("id", { count: "exact", head: true })
      .eq("issue_id", issueId)
      .is("deleted_at", null)

    if ((count || 0) >= LIMITS.ISSUE_MAX_SUBTASKS) {
      return errorResponse(
        `Issue can have maximum ${LIMITS.ISSUE_MAX_SUBTASKS} subtasks`,
        400
      )
    }

    // Get max position
    const { data: maxPos } = await supabase
      .from("subtasks")
      .select("position")
      .eq("issue_id", issueId)
      .order("position", { ascending: false })
      .limit(1)
      .single()

    const position = (maxPos?.position || 0) + 1

    const { data: subtask, error } = await supabase
      .from("subtasks")
      .insert({
        issue_id: issueId,
        title: body.title,
        position,
      })
      .select()
      .single()

    if (error) throw error

    const result = Subtask.parse({
      id: subtask.id,
      issueId: subtask.issue_id,
      title: subtask.title,
      done: subtask.done,
      position: subtask.position,
    })

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

