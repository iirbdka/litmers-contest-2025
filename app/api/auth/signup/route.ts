import { NextRequest } from "next/server"
import { SignUpForm } from "@/src/schemas/user"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

// POST /api/auth/signup - Register new user (FR-001)
export async function POST(req: NextRequest) {
  try {
    const body = SignUpForm.parse(await req.json())
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          name: body.name,
        },
      },
    })

    if (error) {
      if (error.message.includes("already registered")) {
        return errorResponse("이미 등록된 이메일입니다", 409)
      }
      throw error
    }

    return successResponse({
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      message: "회원가입이 완료되었습니다. 이메일을 확인해주세요.",
    }, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

