import { NextRequest } from "next/server"
import { PersonalDashboard, TeamVM, ProjectListItem, IssueVM, Label } from "@/src/schemas"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError } from "@/lib/api/response"

// GET /api/dashboard - Get personal dashboard data (FR-081)
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()

    // Get user's teams
    const { data: memberships } = await supabase
      .from("team_members")
      .select(`
        role,
        team:teams!inner(id, name, owner_id, created_at, deleted_at)
      `)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .is("team.deleted_at", null)

    const teams = await Promise.all(
      (memberships || []).map(async (m) => {
        const team = m.team as any
        const [projectCount, memberCount] = await Promise.all([
          supabase
            .from("projects")
            .select("id", { count: "exact", head: true })
            .eq("team_id", team.id)
            .is("deleted_at", null),
          supabase
            .from("team_members")
            .select("id", { count: "exact", head: true })
            .eq("team_id", team.id)
            .is("deleted_at", null),
        ])
        return TeamVM.parse({
          id: team.id,
          name: team.name,
          ownerId: team.owner_id,
          createdAt: team.created_at,
          deletedAt: team.deleted_at,
          projectCount: projectCount.count || 0,
          memberCount: memberCount.count || 0,
          myRole: m.role,
        })
      })
    )

    const teamIds = teams.map((t) => t.id)

    // Get user's projects
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .in("team_id", teamIds.length > 0 ? teamIds : [""])
      .is("deleted_at", null)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(10)

    const projectList = await Promise.all(
      (projects || []).map(async (p) => {
        const { count } = await supabase
          .from("issues")
          .select("id", { count: "exact", head: true })
          .eq("project_id", p.id)
          .is("deleted_at", null)

        const { data: favorite } = await supabase
          .from("favorites")
          .select("user_id")
          .eq("project_id", p.id)
          .eq("user_id", user.id)
          .maybeSingle()

        return ProjectListItem.parse({
          id: p.id,
          teamId: p.team_id,
          ownerId: p.owner_id,
          name: p.name,
          description: p.description,
          isArchived: p.is_archived,
          isFavorite: !!favorite,
          createdAt: p.created_at,
          deletedAt: p.deleted_at,
          issueCount: count || 0,
        })
      })
    )

    // Get issues assigned to user
    const { data: myIssues } = await supabase
      .from("issues")
      .select(`
        *,
        status:project_statuses!inner(id, name, color),
        assignee:profiles!issues_assignee_user_id_fkey(id, name, profile_image)
      `)
      .eq("assignee_user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    // Group issues by status
    const issuesByStatus = new Map<string, any[]>()
    for (const issue of myIssues || []) {
      const statusName = (issue.status as any)?.name || "Backlog"
      if (!issuesByStatus.has(statusName)) {
        issuesByStatus.set(statusName, [])
      }
      issuesByStatus.get(statusName)!.push(issue)
    }

    const byStatusArray = Array.from(issuesByStatus.entries()).map(
      ([status, issues]) => ({
        status,
        count: issues.length,
        issues: issues.slice(0, 5).map((i) => formatIssue(i)),
      })
    )

    // Get upcoming issues (due within 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)

    const { data: upcomingIssues } = await supabase
      .from("issues")
      .select(`
        *,
        status:project_statuses!inner(id, name, color),
        assignee:profiles!issues_assignee_user_id_fkey(id, name, profile_image)
      `)
      .eq("assignee_user_id", user.id)
      .is("deleted_at", null)
      .not("due_date", "is", null)
      .lte("due_date", nextWeek.toISOString())
      .gte("due_date", new Date().toISOString())
      .neq("status.name", "Done")
      .order("due_date")
      .limit(5)

    // Get today's issues
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: todayIssues } = await supabase
      .from("issues")
      .select(`
        *,
        status:project_statuses!inner(id, name, color),
        assignee:profiles!issues_assignee_user_id_fkey(id, name, profile_image)
      `)
      .eq("assignee_user_id", user.id)
      .is("deleted_at", null)
      .gte("due_date", today.toISOString())
      .lt("due_date", tomorrow.toISOString())
      .neq("status.name", "Done")

    // Get recent comments written by user
    const { data: recentComments } = await supabase
      .from("comments")
      .select(`
        id,
        issue_id,
        content,
        created_at,
        issue:issues!inner(title)
      `)
      .eq("author_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(5)

    const result = PersonalDashboard.parse({
      myIssues: {
        total: (myIssues || []).length,
        byStatus: byStatusArray,
      },
      upcomingIssues: (upcomingIssues || []).map(formatIssue),
      todayIssues: (todayIssues || []).map(formatIssue),
      recentComments: (recentComments || []).map((c) => ({
        id: c.id,
        issueId: c.issue_id,
        issueTitle: (c.issue as any)?.title || "",
        content: c.content,
        createdAt: c.created_at,
      })),
      teams,
      projects: projectList,
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

function formatIssue(issue: any): any {
  const statusData = issue.status as any
  const assignee = issue.assignee as any

  return IssueVM.parse({
    id: issue.id,
    projectId: issue.project_id,
    ownerId: issue.owner_id,
    title: issue.title,
    description: issue.description,
    status: statusData?.name || "Backlog",
    priority: issue.priority,
    assigneeUserId: issue.assignee_user_id,
    dueDate: issue.due_date,
    labelIds: [],
    position: issue.position,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    deletedAt: issue.deleted_at,
    ai: {
      summary: issue.ai_summary,
      suggestion: issue.ai_suggestion,
      commentSummary: issue.ai_comment_summary,
    },
    assignee: assignee
      ? {
          id: assignee.id,
          name: assignee.name,
          profileImage: assignee.profile_image,
        }
      : null,
    labels: [],
    subtaskCount: 0,
    completedSubtaskCount: 0,
    commentCount: 0,
  })
}

