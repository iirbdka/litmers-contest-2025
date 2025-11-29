import { NextRequest } from "next/server"
import { ChangePasswordForm } from "@/src/schemas/user"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

// POST /api/profile/change-password - Change password (FR-006)
export async function POST(req: NextRequest) {
  try {
    const body = ChangePasswordForm.parse(await req.json())
    const supabase = await createSupabaseServerClient()

    // Verify current password by re-authenticating
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.email) {
      return errorResponse("Unauthorized", 401)
    }

    // Try to sign in with current password to verify it
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: body.currentPassword,
    })

    if (verifyError) {
      return errorResponse("현재 비밀번호가 올바르지 않습니다", 400)
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
      password: body.newPassword,
    })

    if (error) throw error

    return successResponse({
      message: "비밀번호가 성공적으로 변경되었습니다.",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

