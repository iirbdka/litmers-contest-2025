import { NextRequest } from "next/server"
import { TeamInvite, TeamInviteForm } from "@/src/schemas/team"
import { LIMITS } from "@/src/schemas/validators"
import { requireTeamMembership, requireTeamAdmin } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"
import { sendTeamInviteEmail } from "@/lib/email"

type RouteParams = { params: Promise<{ teamId: string }> }

// GET /api/teams/:teamId/invites - List pending invites
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params
    const { supabase } = await requireTeamMembership(teamId)

    const { data: invites, error } = await supabase
      .from("team_invites")
      .select("*")
      .eq("team_id", teamId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    if (error) throw error

    const result = (invites || []).map((i) =>
      TeamInvite.parse({
        id: i.id,
        teamId: i.team_id,
        email: i.email,
        status: i.status,
        expiresAt: i.expires_at,
        createdAt: i.created_at,
      })
    )

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/teams/:teamId/invites - Send invite
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params
    const { supabase, user } = await requireTeamAdmin(teamId)
    const body = TeamInviteForm.parse(await req.json())

    // Get team info
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single()

    if (teamError || !team) {
      return errorResponse("Team not found", 404)
    }

    // Get inviter's profile
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from("team_invites")
      .select("id, expires_at")
      .eq("team_id", teamId)
      .eq("email", body.email)
      .eq("status", "pending")
      .single()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + LIMITS.INVITE_EXPIRY_DAYS)

    let invite: any

    if (existingInvite) {
      // Update expires_at for resend
      const { data, error } = await supabase
        .from("team_invites")
        .update({ expires_at: expiresAt.toISOString() })
        .eq("id", existingInvite.id)
        .select()
        .single()

      if (error) throw error
      invite = data
    } else {
      // Create new invite
      const { data, error } = await supabase
        .from("team_invites")
        .insert({
          team_id: teamId,
          email: body.email,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      invite = data
    }

    // Send invite email
    try {
      await sendTeamInviteEmail({
        to: body.email,
        teamName: team.name,
        inviterName: inviterProfile?.name || "팀원",
        inviteId: invite.id,
      })
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError)
      // Don't fail the request if email fails - the invite is still created
    }

    const result = TeamInvite.parse({
      id: invite.id,
      teamId: invite.team_id,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expires_at,
      createdAt: invite.created_at,
    })

    return successResponse(result, existingInvite ? 200 : 201)
  } catch (error) {
    return handleApiError(error)
  }
}

