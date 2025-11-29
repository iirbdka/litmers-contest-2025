import { NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { successResponse, errorResponse } from "@/lib/api/response"

// GET /api/debug/auth - Debug authentication state
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return successResponse({
        authenticated: false,
        error: userError?.message || "No user found",
        sessionExists: !!session,
        sessionError: sessionError?.message,
      })
    }

    // Test RLS by querying team_members
    const { data: teamMembers, error: tmError } = await supabase
      .from("team_members")
      .select("id, team_id, role")
      .eq("user_id", user.id)
      .is("deleted_at", null)

    // Test RLS by querying teams directly
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .is("deleted_at", null)

    // Test RLS by querying issues
    const { data: issues, error: issuesError } = await supabase
      .from("issues")
      .select("id, title")
      .eq("assignee_user_id", user.id)
      .is("deleted_at", null)
      .limit(5)

    // Check if service role key is set
    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

    return successResponse({
      authenticated: true,
      hasServiceRoleKey,
      user: {
        id: user.id,
        email: user.email,
      },
      session: {
        exists: !!session,
        expiresAt: session?.expires_at,
      },
      rlsTests: {
        teamMembers: {
          count: teamMembers?.length || 0,
          error: tmError?.message,
          data: teamMembers,
        },
        teams: {
          count: teams?.length || 0,
          error: teamsError?.message,
        },
        issues: {
          count: issues?.length || 0,
          error: issuesError?.message,
          data: issues,
        },
      },
    })
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error",
      500
    )
  }
}

