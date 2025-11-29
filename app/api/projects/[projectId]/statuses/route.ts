import { NextRequest } from "next/server"
import { z } from "zod"
import { CustomStatus, CustomStatusForm } from "@/src/schemas/project"
import { LIMITS } from "@/src/schemas/validators"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ projectId: string }> }

// GET /api/projects/:projectId/statuses - List project statuses
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

    const [statusesResult, wipLimitsResult] = await Promise.all([
      supabase
        .from("project_statuses")
        .select("*")
        .eq("project_id", projectId)
        .order("position"),
      supabase
        .from("project_wip_limits")
        .select("*")
        .eq("project_id", projectId),
    ])

    if (statusesResult.error) throw statusesResult.error

    const wipLimitsMap = new Map(
      (wipLimitsResult.data || []).map((w) => [w.status_id, w.wip_limit])
    )

    const result = (statusesResult.data || []).map((s) =>
      CustomStatus.parse({
        id: s.id,
        projectId: s.project_id,
        name: s.name,
        color: s.color || undefined,
        position: s.position,
        wipLimit: wipLimitsMap.get(s.id) || null,
      })
    )

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/projects/:projectId/statuses - Create custom status
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { projectId } = await params
    const { supabase, user } = await requireAuth()
    const body = CustomStatusForm.parse(await req.json())

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

    // Check custom status limit (5 custom + 3 base)
    const { count } = await supabase
      .from("project_statuses")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("is_base", false)

    if ((count || 0) >= LIMITS.PROJECT_MAX_CUSTOM_STATUSES) {
      return errorResponse(
        `Project can have maximum ${LIMITS.PROJECT_MAX_CUSTOM_STATUSES} custom statuses`,
        400
      )
    }

    // Get max position
    const { data: maxPos } = await supabase
      .from("project_statuses")
      .select("position")
      .eq("project_id", projectId)
      .order("position", { ascending: false })
      .limit(1)
      .single()

    const position = (maxPos?.position || 0) + 1

    const { data: status, error } = await supabase
      .from("project_statuses")
      .insert({
        project_id: projectId,
        name: body.name,
        color: body.color || null,
        position,
        is_base: false,
      })
      .select()
      .single()

    if (error) throw error

    // Create WIP limit if provided
    if (body.wipLimit) {
      await supabase.from("project_wip_limits").insert({
        project_id: projectId,
        status_id: status.id,
        wip_limit: body.wipLimit,
      })
    }

    const result = CustomStatus.parse({
      id: status.id,
      projectId: status.project_id,
      name: status.name,
      color: status.color || undefined,
      position: status.position,
      wipLimit: body.wipLimit || null,
    })

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

