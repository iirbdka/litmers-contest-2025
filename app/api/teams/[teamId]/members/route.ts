import { NextRequest } from "next/server"
import { z } from "zod"
import { TeamMemberVM, UserRole } from "@/src/schemas"
import { requireTeamMembership, requireTeamAdmin } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ teamId: string }> }

// GET /api/teams/:teamId/members - List team members
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params
    const { supabase } = await requireTeamMembership(teamId)

    const { data: members, error } = await supabase
      .from("team_members")
      .select(`
        id,
        team_id,
        user_id,
        role,
        joined_at,
        deleted_at,
        user:profiles!inner(
          id,
          name,
          profile_image
        )
      `)
      .eq("team_id", teamId)
      .is("deleted_at", null)
      .order("joined_at", { ascending: true })

    if (error) throw error

    const result = (members || []).map((m) => {
      const user = m.user as any
      return TeamMemberVM.parse({
        id: m.id,
        teamId: m.team_id,
        userId: m.user_id,
        role: m.role,
        joinedAt: m.joined_at,
        deletedAt: m.deleted_at,
        user: {
          id: user.id,
          name: user.name,
          email: null,
          profileImage: user.profile_image,
        },
      })
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/teams/:teamId/members - Add member (used after invite accepted)
const AddMemberBody = z.object({
  userId: z.string().uuid(),
  role: UserRole.optional().default("MEMBER"),
})

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId } = await params
    const { supabase } = await requireTeamAdmin(teamId)
    const body = AddMemberBody.parse(await req.json())

    // Check if already a member
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", body.userId)
      .is("deleted_at", null)
      .single()

    if (existing) {
      return errorResponse("User is already a team member", 409)
    }

    const { data: member, error } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        user_id: body.userId,
        role: body.role,
      })
      .select(`
        id,
        team_id,
        user_id,
        role,
        joined_at,
        deleted_at,
        user:profiles!inner(
          id,
          name,
          profile_image
        )
      `)
      .single()

    if (error) throw error

    const user = member.user as any
    const result = TeamMemberVM.parse({
      id: member.id,
      teamId: member.team_id,
      userId: member.user_id,
      role: member.role,
      joinedAt: member.joined_at,
      deletedAt: member.deleted_at,
      user: {
        id: user.id,
        name: user.name,
        email: null,
        profileImage: user.profile_image,
      },
    })

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

