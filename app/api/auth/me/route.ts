import { NextRequest } from "next/server"
import { User } from "@/src/schemas/user"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError } from "@/lib/api/response"

// GET /api/auth/me - Get current user
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (error) throw error

    const result = User.parse({
      id: profile.id,
      email: user.email,
      name: profile.name,
      profileImage: profile.profile_image,
      provider: profile.provider,
      createdAt: profile.created_at,
      deletedAt: profile.deleted_at,
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

