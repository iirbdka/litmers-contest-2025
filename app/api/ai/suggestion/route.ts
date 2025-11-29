import { NextRequest } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"
import { checkAIRateLimit } from "../rate-limit"
import { generateIssueSuggestion } from "@/lib/openai"

const SuggestionBody = z.object({
  issueId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  regenerate: z.boolean().optional(),
})

// POST /api/ai/suggestion - Generate AI solution suggestion (FR-041)
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const body = SuggestionBody.parse(await req.json())

    // Check rate limit
    const rateCheck = await checkAIRateLimit(supabase, user.id)
    if (!rateCheck.allowed) {
      return errorResponse(rateCheck.reason!, 429)
    }

    // Verify issue access
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("id, ai_suggestion, project:projects!inner(team_id)")
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

    // Return cached suggestion if available (unless regenerate is requested)
    if (issue.ai_suggestion && !body.regenerate) {
      return successResponse({ suggestion: issue.ai_suggestion, cached: true })
    }

    // Generate suggestion using OpenAI
    const suggestion = await generateIssueSuggestion(body.title, body.description)

    // Cache the result
    await supabase
      .from("issues")
      .update({ ai_suggestion: suggestion })
      .eq("id", body.issueId)

    return successResponse({ suggestion, cached: false })
  } catch (error) {
    return handleApiError(error)
  }
}

