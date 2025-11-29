import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ inviteId: string }> }

// GET /api/invite/:inviteId - Get invite info
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { inviteId } = await params
    const supabase = await createSupabaseServerClient()

    const { data: invite, error } = await supabase
      .from("team_invites")
      .select(`
        id,
        team_id,
        email,
        status,
        expires_at,
        team:teams!inner(name)
      `)
      .eq("id", inviteId)
      .single()

    if (error || !invite) {
      return errorResponse("Invite not found", 404)
    }

    const teamData = invite.team as any

    return successResponse({
      id: invite.id,
      teamId: invite.team_id,
      teamName: teamData.name,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expires_at,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

