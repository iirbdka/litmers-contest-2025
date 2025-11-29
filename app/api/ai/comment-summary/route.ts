import { NextRequest } from "next/server"
import { z } from "zod"
import { LIMITS } from "@/src/schemas/validators"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"
import { checkAIRateLimit } from "../rate-limit"
import { generateCommentsSummary } from "@/lib/openai"

const CommentSummaryBody = z.object({
  issueId: z.string().uuid(),
  regenerate: z.boolean().optional(),
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
        `댓글이 ${LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY}개 이상일 때 사용 가능합니다`,
        400
      )
    }

    // Check rate limit
    const rateCheck = await checkAIRateLimit(supabase, user.id)
    if (!rateCheck.allowed) {
      return errorResponse(rateCheck.reason!, 429)
    }

    // Return cached summary if available (unless regenerate is requested)
    if (issue.ai_comment_summary && !body.regenerate) {
      return successResponse({ summary: issue.ai_comment_summary, cached: true })
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabase
      .from("comments")
      .select("content, author:profiles!comments_author_id_fkey(name)")
      .eq("issue_id", body.issueId)
      .is("deleted_at", null)
      .order("created_at")

    if (commentsError) throw commentsError

    // Format comments for AI
    const formattedComments = (comments || []).map((c) => ({
      content: c.content,
      authorName: (c.author as any)?.name || "Unknown",
    }))

    // Generate summary using OpenAI
    const summary = await generateCommentsSummary(formattedComments)

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

