import { NextRequest } from "next/server"
import { TeamCreateForm, TeamVM } from "@/src/schemas/team"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError } from "@/lib/api/response"

// GET /api/teams - List user's teams
export async function GET() {
  try {
    const { supabase, user } = await requireAuth()

    const { data: memberships, error } = await supabase
      .from("team_members")
      .select(`
        role,
        team:teams!inner(
          id,
          name,
          owner_id,
          created_at,
          deleted_at
        )
      `)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .is("team.deleted_at", null)

    if (error) throw error

    // Get project and member counts for each team
    const teams = await Promise.all(
      (memberships || []).map(async (m) => {
        const team = m.team as any

        const [projectCount, memberCount] = await Promise.all([
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("team_id", team.id)
            .is("deleted_at", null),
          supabase
            .from("team_members")
            .select("id", { count: "exact", head: true })
            .eq("team_id", team.id)
            .is("deleted_at", null),
        ])

        return TeamVM.parse({
          id: team.id,
          name: team.name,
          ownerId: team.owner_id,
          createdAt: team.created_at,
          deletedAt: team.deleted_at,
          projectCount: projectCount.count || 0,
          memberCount: memberCount.count || 0,
          myRole: m.role,
        })
      })
    )

    return successResponse(teams)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/teams - Create a new team
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const body = TeamCreateForm.parse(await req.json())

    // Use SECURITY DEFINER function to bypass RLS
    const { data: teamId, error: createError } = await supabase.rpc('create_team_for_user', {
      team_name: body.name,
      user_uuid: user.id,
    })

    if (createError) throw createError

    // Fetch the created team
    const { data: team, error: fetchError } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .single()

    if (fetchError) throw fetchError

    // Return TeamVM format
    const result = TeamVM.parse({
      id: team.id,
      name: team.name,
      ownerId: team.owner_id,
      createdAt: team.created_at,
      deletedAt: team.deleted_at,
      projectCount: 0,
      memberCount: 1,
      myRole: "OWNER",
    })

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

