import { NextRequest } from "next/server"
import { successResponse, errorResponse, handleApiError } from "@/lib/api/response"
import { requireAuth } from "@/lib/api/auth"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const { supabase, user } = await requireAuth()

    // Get project and verify access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(`
        id,
        team_id,
        project_statuses (id, name, color)
      `)
      .eq("id", projectId)
      .is("deleted_at", null)
      .single()

    if (projectError || !project) {
      return errorResponse("Project not found", 404)
    }

    // Verify team membership
    const { data: member, error: memberError } = await supabase
      .from("team_members")
      .select("role")
      .eq("team_id", project.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (memberError || !member) {
      return errorResponse("Forbidden", 403)
    }

    // Get issues with status counts
    const { data: issues, error: issuesError } = await supabase
      .from("issues")
      .select(`
        id,
        title,
        status_id,
        priority,
        due_date,
        created_at,
        project_statuses!inner (name)
      `)
      .eq("project_id", projectId)
      .is("deleted_at", null)

    if (issuesError) {
      console.error("Issues error:", issuesError)
      return errorResponse("Failed to load issues", 500)
    }

    const statuses = project.project_statuses || []

    // Status counts
    const statusCounts = statuses.map((status: any) => ({
      status: status.name,
      color: status.color,
      count: issues?.filter((i: any) => i.status_id === status.id).length || 0,
    }))

    // Priority counts
    const priorityCounts = [
      { priority: "HIGH" as const, count: issues?.filter((i) => i.priority === "HIGH").length || 0 },
      { priority: "MEDIUM" as const, count: issues?.filter((i) => i.priority === "MEDIUM").length || 0 },
      { priority: "LOW" as const, count: issues?.filter((i) => i.priority === "LOW").length || 0 },
    ]

    // Completion rate (Done status)
    const doneStatus = statuses.find((s: any) => s.name === "Done")
    const doneCount = doneStatus 
      ? issues?.filter((i: any) => i.status_id === doneStatus.id).length || 0
      : 0
    const totalCount = issues?.length || 0
    const completionRate = totalCount > 0 ? (doneCount / totalCount) * 100 : 0

    // Recent issues (last 5)
    const recentIssues = (issues || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        status: issue.project_statuses?.name || "Unknown",
        priority: issue.priority,
        createdAt: issue.created_at,
      }))

    // Upcoming issues (due in 7 days)
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingIssues = (issues || [])
      .filter((issue: any) => {
        if (!issue.due_date) return false
        const dueDate = new Date(issue.due_date)
        // Exclude done issues
        const isDone = doneStatus && issue.status_id === doneStatus.id
        return dueDate >= now && dueDate <= weekFromNow && !isDone
      })
      .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .slice(0, 5)
      .map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        status: issue.project_statuses?.name || "Unknown",
        priority: issue.priority,
        dueDate: issue.due_date,
      }))

    return successResponse({
      statusCounts,
      priorityCounts,
      completionRate,
      recentIssues,
      upcomingIssues,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
