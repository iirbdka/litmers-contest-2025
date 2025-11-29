import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ notificationId: string }> }

// POST /api/notifications/:notificationId/read - Mark as read (FR-091)
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { notificationId } = await params
    const { supabase, user } = await requireAuth()

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id)

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

