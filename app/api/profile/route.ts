import { NextRequest } from "next/server"
import { ProfileUpdateForm, User } from "@/src/schemas/user"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError } from "@/lib/api/response"

// GET /api/profile - Get user profile (FR-005)
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

// PATCH /api/profile - Update user profile (FR-005)
export async function PATCH(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const body = ProfileUpdateForm.parse(await req.json())

    const { data: profile, error } = await supabase
      .from("profiles")
      .update({
        name: body.name,
        profile_image: body.profileImage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
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

