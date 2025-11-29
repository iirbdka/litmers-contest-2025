import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { successResponse, handleApiError } from "@/lib/api/response"

// POST /api/auth/logout - Sign out
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    return successResponse({ message: "로그아웃되었습니다" })
  } catch (error) {
    return handleApiError(error)
  }
}

