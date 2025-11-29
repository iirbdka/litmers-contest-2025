import { NextRequest } from "next/server"
import { z } from "zod"
import { UserRole } from "@/src/schemas"
import { requireTeamAdmin, requireTeamOwner } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ teamId: string; memberId: string }> }

// PATCH /api/teams/:teamId/members/:memberId - Update member role
const UpdateMemberBody = z.object({
  role: UserRole,
})

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, memberId } = await params
    const { supabase, role: currentUserRole } = await requireTeamAdmin(teamId)
    const body = UpdateMemberBody.parse(await req.json())

    // Get the member being updated
    const { data: member, error: memberError } = await supabase
      .from("team_members")
      .select("role, user_id")
      .eq("id", memberId)
      .eq("team_id", teamId)
      .is("deleted_at", null)
      .single()

    if (memberError || !member) {
      return errorResponse("Member not found", 404)
    }

    // Only owner can change to/from OWNER role
    if (member.role === "OWNER" || body.role === "OWNER") {
      await requireTeamOwner(teamId)
    }

    // Admin cannot promote to ADMIN or OWNER
    if (currentUserRole === "ADMIN" && (body.role === "ADMIN" || body.role === "OWNER")) {
      return errorResponse("Admins cannot promote members to Admin or Owner", 403)
    }

    const { error } = await supabase
      .from("team_members")
      .update({ role: body.role })
      .eq("id", memberId)

    if (error) throw error

    // Create notification for role change
    await supabase.from("notifications").insert({
      user_id: member.user_id,
      type: "role_changed",
      payload: { teamId, newRole: body.role },
    })

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/teams/:teamId/members/:memberId - Remove member
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { teamId, memberId } = await params
    const { supabase } = await requireTeamAdmin(teamId)

    // Get the member being removed
    const { data: member, error: memberError } = await supabase
      .from("team_members")
      .select("role")
      .eq("id", memberId)
      .eq("team_id", teamId)
      .is("deleted_at", null)
      .single()

    if (memberError || !member) {
      return errorResponse("Member not found", 404)
    }

    // Cannot remove owner
    if (member.role === "OWNER") {
      return errorResponse("Cannot remove team owner", 403)
    }

    // Soft delete
    const { error } = await supabase
      .from("team_members")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", memberId)

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

