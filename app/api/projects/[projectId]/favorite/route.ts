import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ projectId: string }> }

// POST /api/projects/:projectId/favorite - Add to favorites
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const { supabase, user } = await requireAuth()

    // Verify project exists and user has access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("team_id")
      .eq("id", projectId)
      .is("deleted_at", null)
      .single()

    if (projectError || !project) {
      return errorResponse("Project not found", 404)
    }

    // Verify team membership
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

    // Add to favorites (upsert to handle duplicates)
    const { error } = await supabase
      .from("favorites")
      .upsert({
        user_id: user.id,
        project_id: projectId,
      })

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/projects/:projectId/favorite - Remove from favorites
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const { supabase, user } = await requireAuth()

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("project_id", projectId)

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

