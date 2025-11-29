import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ inviteId: string }> }

// POST /api/invite/:inviteId/accept - Accept invite
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { inviteId } = await params
    const { supabase, user } = await requireAuth()

    // Get invite
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("*")
      .eq("id", inviteId)
      .eq("status", "pending")
      .single()

    if (inviteError || !invite) {
      return errorResponse("Invite not found or already used", 404)
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      return errorResponse("Invite has expired", 410)
    }

    // Check if user email matches invite email (optional - can be removed if any user can accept)
    // if (user.email !== invite.email) {
    //   return errorResponse("This invite was sent to a different email address", 403)
    // }

    // Check if user is already a team member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", invite.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (existingMember) {
      // Update invite status to accepted anyway
      await supabase
        .from("team_invites")
        .update({ status: "accepted" })
        .eq("id", inviteId)

      return errorResponse("You are already a member of this team", 409)
    }

    // Add user to team
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({
        team_id: invite.team_id,
        user_id: user.id,
        role: "MEMBER",
      })

    if (memberError) throw memberError

    // Update invite status
    const { error: updateError } = await supabase
      .from("team_invites")
      .update({ status: "accepted" })
      .eq("id", inviteId)

    if (updateError) throw updateError

    return successResponse({ success: true, teamId: invite.team_id })
  } catch (error) {
    return handleApiError(error)
  }
}

