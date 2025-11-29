import { NextRequest } from "next/server"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError } from "@/lib/api/response"

// GET /api/notifications/unread-count - Get unread count
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()

    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)

    if (error) throw error

    return successResponse({ count: count || 0 })
  } catch (error) {
    return handleApiError(error)
  }
}

