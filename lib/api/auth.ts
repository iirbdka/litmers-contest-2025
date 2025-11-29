import { createSupabaseServerClient, createSupabaseServerClientWithAdmin } from "@/lib/supabase/server"
import { errorResponse } from "./response"

export async function requireAuth() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized")
  }

  // Try to use admin client if service role key is available, otherwise use regular client
  let queryClient = supabase
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      queryClient = await createSupabaseServerClientWithAdmin()
    } catch {
      // Fall back to regular client if admin client fails
      console.warn("Failed to create admin client, using regular client")
    }
  }

  return { supabase: queryClient, user }
}

export async function requireTeamMembership(teamId: string) {
  const { supabase, user } = await requireAuth()

  const { data: member, error } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single()

  if (error || !member) {
    throw new Error("Forbidden")
  }

  return { supabase, user, role: member.role }
}

export async function requireTeamAdmin(teamId: string) {
  const result = await requireTeamMembership(teamId)

  if (result.role !== "OWNER" && result.role !== "ADMIN") {
    throw new Error("Forbidden")
  }

  return result
}

export async function requireTeamOwner(teamId: string) {
  const result = await requireTeamMembership(teamId)

  if (result.role !== "OWNER") {
    throw new Error("Forbidden")
  }

  return result
}

