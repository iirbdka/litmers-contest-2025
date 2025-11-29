import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError } from "@/lib/api/response"

// POST /api/notifications/read-all - Mark all as read (FR-091)
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false)

    if (error) throw error

    return successResponse({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}

