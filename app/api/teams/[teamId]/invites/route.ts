import { NextRequest } from "next/server"
import { TeamInvite, TeamInviteForm } from "@/src/schemas/team"
import { LIMITS } from "@/src/schemas/validators"
import { requireTeamMembership, requireTeamAdmin } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

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
    const { supabase } = await requireTeamAdmin(teamId)
    const body = TeamInviteForm.parse(await req.json())

    // Check if email is already a team member
    const { data: existingMember } = await supabase
      .from("team_members")
      .select(`
        id,
        user:profiles!inner(id)
      `)
      .eq("team_id", teamId)
      .is("deleted_at", null)

    // Check if user exists with this email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", (await supabase.auth.admin?.listUsers())?.data?.users?.find(
        (u) => u.email === body.email
      )?.id || "")
      .single()

    if (existingMember?.some((m) => (m.user as any)?.id === profile?.id)) {
      return errorResponse("User is already a team member", 409)
    }

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

      // TODO: Trigger email send via Edge Function

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

    // TODO: Trigger email send via Edge Function

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

