import { NextRequest } from "next/server"
import { z } from "zod"
import { ProjectCreateForm, ProjectListItem, ProjectVM, Label, CustomStatus } from "@/src/schemas/project"
import { LIMITS } from "@/src/schemas/validators"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

// GET /api/projects - List projects (requires teamId query param)
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const url = new URL(req.url)
    const teamId = url.searchParams.get("teamId")

    if (!teamId) {
      return errorResponse("teamId query parameter is required", 400)
    }

    // Verify team membership
    const { data: member, error: memberError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (memberError || !member) {
      return errorResponse("Forbidden", 403)
    }

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("team_id", teamId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get issue counts and favorites for each project
    const result = await Promise.all(
      (projects || []).map(async (p) => {
        const [issueCount, favorite] = await Promise.all([
          supabase
            .from("issues")
            .select("id", { count: "exact", head: true })
            .eq("project_id", p.id)
            .is("deleted_at", null),
          supabase
            .from("favorites")
            .select("user_id")
            .eq("project_id", p.id)
            .eq("user_id", user.id)
            .maybeSingle(),
        ])

        return ProjectListItem.parse({
          id: p.id,
          teamId: p.team_id,
          ownerId: p.owner_id,
          name: p.name,
          description: p.description,
          isArchived: p.is_archived,
          isFavorite: !!favorite.data,
          createdAt: p.created_at,
          deletedAt: p.deleted_at,
          issueCount: issueCount.count || 0,
        })
      })
    )

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/projects - Create a new project
const CreateProjectBody = ProjectCreateForm.extend({
  teamId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const body = CreateProjectBody.parse(await req.json())

    // Verify team membership
    const { data: member, error: memberError } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", body.teamId)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (memberError || !member) {
      return errorResponse("Forbidden", 403)
    }

    // Check project limit (15 per team)
    const { count } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("team_id", body.teamId)
      .is("deleted_at", null)

    if ((count || 0) >= LIMITS.TEAM_MAX_PROJECTS) {
      return errorResponse(`Team can have maximum ${LIMITS.TEAM_MAX_PROJECTS} projects`, 400)
    }

    // Use SECURITY DEFINER function to bypass RLS
    const { data: projectId, error: createError } = await supabase.rpc('create_project_for_user', {
      project_name: body.name,
      project_description: body.description || null,
      team_uuid: body.teamId,
      user_uuid: user.id,
    })

    if (createError) throw createError

    // Fetch the created project
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single()

    if (error) throw error

    // Get the default statuses created by trigger
    const { data: statuses } = await supabase
      .from("project_statuses")
      .select("*")
      .eq("project_id", project.id)
      .order("position")

    const result = ProjectVM.parse({
      id: project.id,
      teamId: project.team_id,
      ownerId: project.owner_id,
      name: project.name,
      description: project.description,
      isArchived: project.is_archived,
      isFavorite: false,
      createdAt: project.created_at,
      deletedAt: project.deleted_at,
      issueCount: 0,
      completedIssueCount: 0,
      labels: [],
      customStatuses: (statuses || []).map((s) =>
        CustomStatus.parse({
          id: s.id,
          projectId: s.project_id,
          name: s.name,
          color: s.color || undefined,
          position: s.position,
          wipLimit: null,
        })
      ),
    })

    // Log activity
    await supabase.from("activities").insert({
      team_id: body.teamId,
      actor_id: user.id,
      action: "created",
      target: `project:${project.id}`,
      metadata: { projectName: project.name },
    })

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

