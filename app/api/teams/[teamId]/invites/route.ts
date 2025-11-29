import { NextRequest } from "next/server"
import { TeamInvite, TeamInviteForm } from "@/src/schemas/team"
import { LIMITS } from "@/src/schemas/validators"
import { requireTeamMembership, requireTeamAdmin } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ teamId: string }> }

// Send invite email via Supabase Edge Function
async function sendInviteEmail(
  to: string,
  teamName: string,
  inviterName: string,
  inviteId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const inviteUrl = `${baseUrl}/invite/${inviteId}`

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase URL or Anon Key not configured")
      return
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        type: "team_invite",
        to,
        data: {
          teamName,
          inviterName,
          inviteUrl,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Failed to send invite email:", error)
    }
  } catch (error) {
    console.error("Error sending invite email:", error)
  }
}

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

    // Get team info for email
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("name")
      .eq("id", teamId)
      .single()

    if (teamError || !team) {
      return errorResponse("Team not found", 404)
    }

    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()

    const inviterName = inviterProfile?.name || user.email || "팀 관리자"

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

    if (existingInvite) {
      // Update expires_at for resend
      const { data: invite, error } = await supabase
        .from("team_invites")
        .update({ expires_at: expiresAt.toISOString() })
        .eq("id", existingInvite.id)
        .select()
        .single()

      if (error) throw error

      // Send invite email
      await sendInviteEmail(body.email, team.name, inviterName, invite.id)

      const result = TeamInvite.parse({
        id: invite.id,
        teamId: invite.team_id,
        email: invite.email,
        status: invite.status,
        expiresAt: invite.expires_at,
        createdAt: invite.created_at,
      })

      return successResponse(result)
    }

    // Create new invite
    const { data: invite, error } = await supabase
      .from("team_invites")
      .insert({
        team_id: teamId,
        email: body.email,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Send invite email
    await sendInviteEmail(body.email, team.name, inviterName, invite.id)

    const result = TeamInvite.parse({
      id: invite.id,
      teamId: invite.team_id,
      email: invite.email,
      status: invite.status,
      expiresAt: invite.expires_at,
      createdAt: invite.created_at,
    })

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

