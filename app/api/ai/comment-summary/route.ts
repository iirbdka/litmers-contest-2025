import { NextRequest } from "next/server"
import { z } from "zod"
import { LIMITS } from "@/src/schemas/validators"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"
import { checkAIRateLimit } from "../rate-limit"

const CommentSummaryBody = z.object({
  issueId: z.string().uuid(),
})

// POST /api/ai/comment-summary - Summarize comments (FR-045)
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const body = CommentSummaryBody.parse(await req.json())

    // Verify issue access
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("id, ai_comment_summary, project:projects!inner(team_id)")
      .eq("id", body.issueId)
      .is("deleted_at", null)
      .single()

    if (issueError || !issue) {
      return errorResponse("Issue not found", 404)
    }

    const projectData = issue.project as any

    const { data: member } = await supabase
      .from("team_members")
      .select("id")
      .eq("team_id", projectData.team_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single()

    if (!member) {
      return errorResponse("Forbidden", 403)
    }

    // Check comment count (minimum 5 required)
    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("issue_id", body.issueId)
      .is("deleted_at", null)

    if ((count || 0) < LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY) {
      return errorResponse(
        `At least ${LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY} comments required for summary`,
        400
      )
    }

    // Check rate limit
    const rateCheck = await checkAIRateLimit(supabase, user.id)
    if (!rateCheck.allowed) {
      return errorResponse(rateCheck.reason!, 429)
    }

    // Return cached summary if available
    if (issue.ai_comment_summary) {
      return successResponse({ summary: issue.ai_comment_summary, cached: true })
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("content, author:profiles!inner(name)")
      .eq("issue_id", body.issueId)
      .is("deleted_at", null)
      .order("created_at")

    if (commentsError) throw commentsError

    // Generate summary using AI
    const summary = await generateCommentSummary(comments || [])

    // Cache the result
    await supabase
      .from("issues")
      .update({ ai_comment_summary: summary })
      .eq("id", body.issueId)

    return successResponse({ summary, cached: false })
  } catch (error) {
    return handleApiError(error)
  }
}

async function generateCommentSummary(
  comments: { content: string; author: any }[]
): Promise<string> {
  // TODO: Replace with actual AI API call
  // Mock implementation
  const totalComments = comments.length
  const authors = new Set(comments.map((c) => c.author?.name || "Unknown"))
  
  return `This discussion has ${totalComments} comments from ${authors.size} participants. Key points include: ${comments
    .slice(0, 3)
    .map((c) => c.content.substring(0, 50))
    .join("; ")}...`
}

