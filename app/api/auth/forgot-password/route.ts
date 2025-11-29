import { NextRequest } from "next/server"
import { ForgotPasswordForm } from "@/src/schemas/user"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { successResponse, handleApiError } from "@/lib/api/response"

// POST /api/auth/forgot-password - Request password reset (FR-003)
export async function POST(req: NextRequest) {
  try {
    const body = ForgotPasswordForm.parse(await req.json())
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) throw error

    // Always return success to prevent email enumeration
    return successResponse({
      message: "비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.",
    })
  } catch (error) {
    return handleApiError(error)
  }
}

