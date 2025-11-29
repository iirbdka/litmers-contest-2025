import { NextRequest } from "next/server"
import { ResetPasswordForm } from "@/src/schemas/user"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

// POST /api/auth/reset-password - Reset password with token (FR-003)
export async function POST(req: NextRequest) {
  try {
    const body = ResetPasswordForm.parse(await req.json())
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.updateUser({
      password: body.password,
    })

    if (error) {
      if (error.message.includes("expired") || error.message.includes("invalid")) {
        return errorResponse("비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다", 400)
      }
      throw error
    }

    return successResponse({
      message: "비밀번호가 성공적으로 변경되었습니다.",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

