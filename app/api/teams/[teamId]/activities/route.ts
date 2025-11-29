import { NextRequest } from "next/server"
import { z } from "zod"
import { ActivityLogItemVM } from "@/src/schemas/team"
import { PaginatedResponse } from "@/src/schemas/common"
import { requireTeamMembership } from "@/lib/api/auth"
import { successResponse, handleApiError } from "@/lib/api/response"

type RouteParams = { params: Promise<{ teamId: string }> }

const PaginatedActivities = PaginatedResponse(ActivityLogItemVM)

// GET /api/teams/:teamId/activities - List team activities
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params
    const { supabase } = await requireTeamMembership(teamId)

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20")
    const offset = (page - 1) * pageSize

    // Get total count
    const { count } = await supabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("team_id", teamId)

    // Get activities with actor info
    const { data: activities, error } = await supabase
      .from("activities")
      .select(`
        id,
        team_id,
        actor_id,
        action,
        target,
        metadata,
        created_at,
        actor:profiles!inner(
          id,
          name,
          profile_image
        )
      `)
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    const items = (activities || []).map((a) => {
      const actor = a.actor as any
      return ActivityLogItemVM.parse({
        id: a.id,
        teamId: a.team_id,
        actorId: a.actor_id,
        action: a.action,
        target: a.target,
        metadata: a.metadata || undefined,
        createdAt: a.created_at,
        actor: {
          id: actor.id,
          name: actor.name,
          profileImage: actor.profile_image,
        },
      })
    })

    const result = PaginatedActivities.parse({
      items,
      total: count || 0,
      page,
      pageSize,
      hasMore: offset + pageSize < (count || 0),
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

