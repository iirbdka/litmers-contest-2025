import { NextResponse } from "next/server"
import { ZodError } from "zod"

export type ApiSuccessResponse<T> = {
  success: true
  data: T
}

export type ApiErrorResponse = {
  success: false
  error: string
  details?: unknown
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export function successResponse<T>(data: T, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(
  error: string,
  status = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = { success: false, error }
  if (details !== undefined) {
    response.details = details
  }
  return NextResponse.json(response, { status })
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  console.error("API Error:", error)

  if (error instanceof ZodError) {
    return errorResponse("Validation error", 400, error.errors)
  }

  if (error instanceof Error) {
    // Supabase specific errors
    if (error.message.includes("JWT")) {
      return errorResponse("Unauthorized", 401)
    }
    if (error.message.includes("violates row-level security")) {
      return errorResponse("Forbidden", 403)
    }
    if (error.message.includes("duplicate key")) {
      return errorResponse("Resource already exists", 409)
    }
    if (error.message.includes("not found") || error.message.includes("no rows")) {
      return errorResponse("Not found", 404)
    }

    return errorResponse(error.message, 500)
  }

  return errorResponse("Internal server error", 500)
}

