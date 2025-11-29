import { NextRequest } from "next/server"
import { z } from "zod"
import { IssueVM, Label } from "@/src/schemas"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"
import { checkAIRateLimit } from "../rate-limit"

const DuplicateBody = z.object({
  projectId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  excludeIssueId: z.string().uuid().optional(),
})

// POST /api/ai/duplicate - Find similar issues (FR-044)
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const body = DuplicateBody.parse(await req.json())

    // Check rate limit
    const rateCheck = await checkAIRateLimit(supabase, user.id)
    if (!rateCheck.allowed) {
      return errorResponse(rateCheck.reason!, 429)
    }

    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("team_id")
      .eq("id", body.projectId)
      .is("deleted_at", null)
      .single()

    if (projectError || !project) {
      return errorResponse("Project not found", 404)
    }

    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", project.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (!member) {
      return errorResponse("Forbidden", 403)
    }

    // Get project issues
    let query = supabase
      .from("issues")
      .select(`
        *,
        status:project_statuses!inner(name, color),
        assignee:profiles!issues_assignee_user_id_fkey(id, name, profile_image)
      `)
      .eq("project_id", body.projectId)
      .is("deleted_at", null)

    if (body.excludeIssueId) {
      query = query.neq("id", body.excludeIssueId)
    }

    const { data: issues, error: issuesError } = await query

    if (issuesError) throw issuesError

    if (!issues || issues.length === 0) {
      return successResponse({ similarIssues: [] })
    }

    // Find similar issues using AI (mock for now)
    const similarIssues = await findSimilarIssues(
      body.title,
      body.description,
      issues
    )

    // Get labels for similar issues
    const result = await Promise.all(
      similarIssues.slice(0, 3).map(async (issue) => {
        const { data: labelData } = await supabase
          .from("issue_labels")
          .select("label:labels(*)")
          .eq("issue_id", issue.id)

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
          labelIds: (labelData || []).map((l: any) => l.label?.id).filter(Boolean),
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
          labels: (labelData || [])
            .filter((l: any) => l.label)
            .map((l: any) =>
              Label.parse({
                id: l.label.id,
                projectId: l.label.project_id,
                name: l.label.name,
                color: l.label.color,
              })
            ),
          subtaskCount: 0,
          completedSubtaskCount: 0,
          commentCount: 0,
        })
      })
    )

    return successResponse({ similarIssues: result })
  } catch (error) {
    return handleApiError(error)
  }
}

async function findSimilarIssues(
  title: string,
  description: string | null,
  issues: any[]
): Promise<any[]> {
  // TODO: Replace with actual AI API call (embeddings comparison)
  // Mock implementation - simple word overlap
  const words = new Set(
    `${title} ${description || ""}`
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
  )

  const scored = issues.map((issue) => {
    const issueWords = `${issue.title} ${issue.description || ""}`
      .toLowerCase()
      .split(/\s+/)
    const overlap = issueWords.filter((w) => words.has(w)).length
    return { issue, score: overlap }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.issue)
}

