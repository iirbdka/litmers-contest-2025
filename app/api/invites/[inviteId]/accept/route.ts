import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ inviteId: string }> }

// POST /api/invites/:inviteId/accept - Accept team invite
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { inviteId } = await params
    const { supabase, user } = await requireAuth()

    // Get the invite
    const { data: invite, error: inviteError } = await supabase
      .from("team_invites")
      .select("*")
      .eq("id", inviteId)
      .eq("status", "pending")
      .single()

    if (inviteError || !invite) {
      return errorResponse("초대를 찾을 수 없거나 만료되었습니다", 404)
    }

    // Check if invite is expired
    if (new Date(invite.expires_at) < new Date()) {
      return errorResponse("초대가 만료되었습니다", 400)
    }

    // Check if user email matches invite email
    if (user.email !== invite.email) {
      return errorResponse("이 초대는 다른 이메일 주소로 발송되었습니다", 403)
    }

    // Check if already a team member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", invite.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (existingMember) {
      // Update invite status anyway
      await supabase
        .from("team_invites")
        .update({ status: "accepted" })
        .eq("id", inviteId)

      return errorResponse("이미 팀 멤버입니다", 409)
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
    await supabase
      .from("team_invites")
      .update({ status: "accepted" })
      .eq("id", inviteId)

    return successResponse({ 
      success: true, 
      teamId: invite.team_id,
      message: "팀에 성공적으로 참여했습니다" 
    })
  } catch (error) {
    return handleApiError(error)
  }
}

