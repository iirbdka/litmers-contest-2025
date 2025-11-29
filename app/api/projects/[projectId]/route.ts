import { NextRequest } from "next/server"
import { ProjectVM, ProjectCreateForm, Label, CustomStatus } from "@/src/schemas/project"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ projectId: string }> }

// GET /api/projects/:projectId - Get project details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const { supabase, user } = await requireAuth()

    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .is("deleted_at", null)
      .single()

    if (error || !project) {
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

    // Get related data
    const [
      issueCountResult,
      completedIssueCountResult,
      labelsResult,
      statusesResult,
      wipLimitsResult,
      favoriteResult,
    ] = await Promise.all([
      supabase
        .from("issues")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .is("deleted_at", null),
      supabase
        .from("issues")
        .select("id, status:project_statuses!inner(name)", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("status.name", "Done")
        .is("deleted_at", null),
      supabase
        .from("labels")
        .select("*")
        .eq("project_id", projectId)
        .is("deleted_at", null),
      supabase
        .from("project_statuses")
        .select("*")
        .eq("project_id", projectId)
        .order("position"),
      supabase
        .from("project_wip_limits")
        .select("*")
        .eq("project_id", projectId),
      supabase
        .from("favorites")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ])

    const wipLimitsMap = new Map(
      (wipLimitsResult.data || []).map((w) => [w.status_id, w.wip_limit])
    )

    const result = ProjectVM.parse({
      id: project.id,
      teamId: project.team_id,
      ownerId: project.owner_id,
      name: project.name,
      description: project.description,
      isArchived: project.is_archived,
      isFavorite: !!favoriteResult.data,
      createdAt: project.created_at,
      deletedAt: project.deleted_at,
      issueCount: issueCountResult.count || 0,
      completedIssueCount: completedIssueCountResult.count || 0,
      labels: (labelsResult.data || []).map((l) =>
        Label.parse({
          id: l.id,
          projectId: l.project_id,
          name: l.name,
          color: l.color,
        })
      ),
      customStatuses: (statusesResult.data || []).map((s) =>
        CustomStatus.parse({
          id: s.id,
          projectId: s.project_id,
          name: s.name,
          color: s.color || undefined,
          position: s.position,
          wipLimit: wipLimitsMap.get(s.id) || null,
        })
      ),
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/projects/:projectId - Update project
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const { supabase, user } = await requireAuth()
    const body = ProjectCreateForm.partial().parse(await req.json())

    // Get project to check ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("team_id, owner_id")
      .eq("id", projectId)
      .is("deleted_at", null)
      .single()

    if (projectError || !project) {
      return errorResponse("Project not found", 404)
    }

    // Check if user is project owner or team admin
    const { data: member } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", project.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (!member) {
      return errorResponse("Forbidden", 403)
    }

    const isOwnerOrAdmin =
      project.owner_id === user.id ||
      member.role === "OWNER" ||
      member.role === "ADMIN"

    if (!isOwnerOrAdmin) {
      return errorResponse("Forbidden", 403)
    }

    const { data: updated, error } = await supabase
      .from("projects")
      .update({
        name: body.name,
        description: body.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .select()
      .single()

    if (error) throw error

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/projects/:projectId - Soft delete project
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const { supabase, user } = await requireAuth()

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("team_id, owner_id")
      .eq("id", projectId)
      .is("deleted_at", null)
      .single()

    if (projectError || !project) {
      return errorResponse("Project not found", 404)
    }

    // Check if user is project owner or team owner
    const { data: member } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", project.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (!member) {
      return errorResponse("Forbidden", 403)
    }

    const canDelete = project.owner_id === user.id || member.role === "OWNER"

    if (!canDelete) {
      return errorResponse("Forbidden", 403)
    }

    const { error } = await supabase
      .from("projects")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", projectId)

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

