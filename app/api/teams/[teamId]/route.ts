import { NextRequest } from "next/server"
import { z } from "zod"
import { TeamVM, TeamCreateForm } from "@/src/schemas/team"
import { requireTeamMembership, requireTeamAdmin, requireTeamOwner } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ teamId: string }> }

// GET /api/teams/:teamId - Get team details
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params
    const { supabase, role } = await requireTeamMembership(teamId)

    const { data: team, error } = await supabase
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .is("deleted_at", null)
      .single()

    if (error || !team) {
      return errorResponse("Team not found", 404)
    }

    const [projectCount, memberCount] = await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId)
        .is("deleted_at", null),
      supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId)
        .is("deleted_at", null),
    ])

    const result = TeamVM.parse({
      id: team.id,
      name: team.name,
      ownerId: team.owner_id,
      createdAt: team.created_at,
      deletedAt: team.deleted_at,
      projectCount: projectCount.count || 0,
      memberCount: memberCount.count || 0,
      myRole: role,
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/teams/:teamId - Update team
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params
    const { supabase, role } = await requireTeamAdmin(teamId)
    const body = TeamCreateForm.partial().parse(await req.json())

    const { data: team, error } = await supabase
      .from("teams")
      .update({
        name: body.name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", teamId)
      .is("deleted_at", null)
      .select()
      .single()

    if (error) throw error

    const [projectCount, memberCount] = await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId)
        .is("deleted_at", null),
      supabase
        .from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId)
        .is("deleted_at", null),
    ])

    const result = TeamVM.parse({
      id: team.id,
      name: team.name,
      ownerId: team.owner_id,
      createdAt: team.created_at,
      deletedAt: team.deleted_at,
      projectCount: projectCount.count || 0,
      memberCount: memberCount.count || 0,
      myRole: role,
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/teams/:teamId - Soft delete team
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params
    const { supabase } = await requireTeamOwner(teamId)

    // Use SECURITY DEFINER function to bypass RLS
    const { data: deleted, error } = await supabase.rpc('soft_delete_team', {
      team_uuid: teamId
    })

    if (error) throw error

    if (!deleted) {
      return errorResponse("Team not found or already deleted", 404)
    }

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

