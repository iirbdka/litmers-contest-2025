import { NextRequest } from "next/server"
import { LoginForm } from "@/src/schemas/user"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

// POST /api/auth/login - Sign in (FR-002)
export async function POST(req: NextRequest) {
  try {
    const body = LoginForm.parse(await req.json())
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    })

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return errorResponse("이메일 또는 비밀번호가 올바르지 않습니다", 401)
      }
      throw error
    }

    return successResponse({
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      session: {
        accessToken: data.session?.access_token,
        expiresAt: data.session?.expires_at,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

