import { NextRequest } from "next/server"
import { z } from "zod"
import { IssueCreateForm, IssueVM, Label } from "@/src/schemas"
import { LIMITS } from "@/src/schemas/validators"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

// GET /api/issues - List issues (requires projectId query param)
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const url = new URL(req.url)
    const projectId = url.searchParams.get("projectId")
    const status = url.searchParams.get("status")
    const assigneeId = url.searchParams.get("assigneeId")
    const priority = url.searchParams.get("priority")

    if (!projectId) {
      return errorResponse("projectId query parameter is required", 400)
    }

    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("team_id")
      .eq("id", projectId)
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

    // Build query
    let query = supabase
      .from("issues")
      .select(`
        *,
        status:project_statuses!inner(id, name, color),
        assignee:profiles!issues_assignee_user_id_fkey(id, name, profile_image)
      `)
      .eq("project_id", projectId)
      .is("deleted_at", null)
      .order("position", { ascending: true })

    if (status) {
      query = query.eq("status.name", status)
    }
    if (assigneeId) {
      query = query.eq("assignee_user_id", assigneeId)
    }
    if (priority && ["HIGH", "MEDIUM", "LOW"].includes(priority)) {
      query = query.eq("priority", priority as "HIGH" | "MEDIUM" | "LOW")
    }

    const { data: issues, error } = await query

    if (error) throw error

    // Get labels and counts for each issue
    const result = await Promise.all(
      (issues || []).map(async (i) => {
        const [labelsResult, subtaskCountResult, completedSubtaskResult, commentCountResult] =
          await Promise.all([
            supabase
              .from("issue_labels")
              .select("label:labels(*)")
              .eq("issue_id", i.id),
            supabase
              .from("subtasks")
              .select("id", { count: "exact", head: true })
              .eq("issue_id", i.id)
              .is("deleted_at", null),
            supabase
              .from("subtasks")
              .select("id", { count: "exact", head: true })
              .eq("issue_id", i.id)
              .eq("done", true)
              .is("deleted_at", null),
            supabase
              .from("comments")
              .select("id", { count: "exact", head: true })
              .eq("issue_id", i.id)
              .is("deleted_at", null),
          ])

        const statusData = i.status as any
        const assignee = i.assignee as any

        return IssueVM.parse({
          id: i.id,
          projectId: i.project_id,
          ownerId: i.owner_id,
          title: i.title,
          description: i.description,
          status: statusData?.name || "Backlog",
          priority: i.priority,
          assigneeUserId: i.assignee_user_id,
          dueDate: i.due_date,
          labelIds: (labelsResult.data || []).map((l: any) => l.label?.id).filter(Boolean),
          position: i.position,
          createdAt: i.created_at,
          updatedAt: i.updated_at,
          deletedAt: i.deleted_at,
          ai: {
            summary: i.ai_summary,
            suggestion: i.ai_suggestion,
            commentSummary: i.ai_comment_summary,
          },
          assignee: assignee
            ? {
                id: assignee.id,
                name: assignee.name,
                profileImage: assignee.profile_image,
              }
            : null,
          labels: (labelsResult.data || [])
            .filter((l: any) => l.label)
            .map((l: any) =>
              Label.parse({
                id: l.label.id,
                projectId: l.label.project_id,
                name: l.label.name,
                color: l.label.color,
              })
            ),
          subtaskCount: subtaskCountResult.count || 0,
          completedSubtaskCount: completedSubtaskResult.count || 0,
          commentCount: commentCountResult.count || 0,
        })
      })
    )

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/issues - Create a new issue
const CreateIssueBody = IssueCreateForm.extend({
  projectId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const body = CreateIssueBody.parse(await req.json())

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

    // Check issue limit (200 per project)
    const { count } = await supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .eq("project_id", body.projectId)
      .is("deleted_at", null)

    if ((count || 0) >= LIMITS.PROJECT_MAX_ISSUES) {
      return errorResponse(
        `Project can have maximum ${LIMITS.PROJECT_MAX_ISSUES} issues`,
        400
      )
    }

    // Get Backlog status (default)
    const { data: backlogStatus } = await supabase
      .from("project_statuses")
      .select("id")
      .eq("project_id", body.projectId)
      .eq("name", "Backlog")
      .single()

    if (!backlogStatus) {
      return errorResponse("Default status not found", 500)
    }

    // Get max position
    const { data: maxPos } = await supabase
      .from("issues")
      .select("position")
      .eq("project_id", body.projectId)
      .eq("status_id", backlogStatus.id)
      .order("position", { ascending: false })
      .limit(1)
      .single()

    const position = (maxPos?.position || 0) + 1

    // Create issue
    const { data: issue, error } = await supabase
      .from("issues")
      .insert({
        project_id: body.projectId,
        owner_id: user.id,
        title: body.title,
        description: body.description || null,
        status_id: backlogStatus.id,
        priority: body.priority || "MEDIUM",
        assignee_user_id: body.assigneeUserId || null,
        due_date: body.dueDate || null,
        position,
      })
      .select()
      .single()

    if (error) throw error

    // Add labels
    if (body.labelIds && body.labelIds.length > 0) {
      await supabase.from("issue_labels").insert(
        body.labelIds.map((labelId) => ({
          issue_id: issue.id,
          label_id: labelId,
        }))
      )
    }

    // Log activity
    await supabase.from("activities").insert({
      team_id: project.team_id,
      actor_id: user.id,
      action: "created",
      target: `issue:${issue.id}`,
      metadata: { issueTitle: issue.title, projectId: body.projectId },
    })

    // Get full issue data for response
    const [labelsResult, assigneeResult] = await Promise.all([
      supabase
        .from("issue_labels")
        .select("label:labels(*)")
        .eq("issue_id", issue.id),
      body.assigneeUserId
        ? supabase
            .from("profiles")
            .select("id, name, profile_image")
            .eq("id", body.assigneeUserId)
            .single()
        : Promise.resolve({ data: null }),
    ])

    const result = IssueVM.parse({
      id: issue.id,
      projectId: issue.project_id,
      ownerId: issue.owner_id,
      title: issue.title,
      description: issue.description,
      status: "Backlog",
      priority: issue.priority,
      assigneeUserId: issue.assignee_user_id,
      dueDate: issue.due_date,
      labelIds: body.labelIds || [],
      position: issue.position,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      deletedAt: issue.deleted_at,
      ai: {
        summary: null,
        suggestion: null,
        commentSummary: null,
      },
      assignee: assigneeResult.data
        ? {
            id: assigneeResult.data.id,
            name: assigneeResult.data.name,
            profileImage: assigneeResult.data.profile_image,
          }
        : null,
      labels: (labelsResult.data || [])
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

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

