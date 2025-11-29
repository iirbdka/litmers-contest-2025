import { NextRequest } from "next/server"
import { Label, LabelForm } from "@/src/schemas/project"
import { LIMITS } from "@/src/schemas/validators"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ projectId: string }> }

// GET /api/projects/:projectId/labels - List project labels
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const { supabase, user } = await requireAuth()

    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("team_id")
      .eq("id", projectId)
      .is("deleted_at", null)
      .single()

    if (projectError || !project) {
      return errorResponse("Project not found", 404)
    }

    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", project.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (!member) {
      return errorResponse("Forbidden", 403)
    }

    const { data: labels, error } = await supabase
      .from("labels")
      .select("*")
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("name")

    if (error) throw error

    const result = (labels || []).map((l) =>
      Label.parse({
        id: l.id,
        projectId: l.project_id,
        name: l.name,
        color: l.color,
      })
    )

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/projects/:projectId/labels - Create label
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const { supabase, user } = await requireAuth()
    const body = LabelForm.parse(await req.json())

    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("team_id")
      .eq("id", projectId)
      .is("deleted_at", null)
      .single()

    if (projectError || !project) {
      return errorResponse("Project not found", 404)
    }

    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", project.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (!member) {
      return errorResponse("Forbidden", 403)
    }

    // Check label limit
    const { count } = await supabase
      .from("labels")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .is("deleted_at", null)

    if ((count || 0) >= LIMITS.PROJECT_MAX_LABELS) {
      return errorResponse(`Project can have maximum ${LIMITS.PROJECT_MAX_LABELS} labels`, 400)
    }

    const { data: label, error } = await supabase
      .from("labels")
      .insert({
        project_id: projectId,
        name: body.name,
        color: body.color,
      })
      .select()
      .single()

    if (error) throw error

    const result = Label.parse({
      id: label.id,
      projectId: label.project_id,
      name: label.name,
      color: label.color,
    })

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

