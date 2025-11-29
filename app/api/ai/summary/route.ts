import { NextRequest } from "next/server"
import { z } from "zod"
import { LIMITS } from "@/src/schemas/validators"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"
import { checkAIRateLimit } from "../rate-limit"

const SummaryBody = z.object({
  issueId: z.string().uuid(),
  description: z.string(),
})

// POST /api/ai/summary - Generate AI summary (FR-040)
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const body = SummaryBody.parse(await req.json())

    // Check description length (minimum 10 chars)
    if (body.description.length < LIMITS.AI_MIN_DESCRIPTION_LENGTH) {
      return errorResponse(
        `Description must be at least ${LIMITS.AI_MIN_DESCRIPTION_LENGTH} characters`,
        400
      )
    }

    // Check rate limit
    const rateCheck = await checkAIRateLimit(supabase, user.id)
    if (!rateCheck.allowed) {
      return errorResponse(rateCheck.reason!, 429)
    }

    // Verify issue access
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("id, ai_summary, project:projects!inner(team_id)")
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

    // Return cached summary if available
    if (issue.ai_summary) {
      return successResponse({ summary: issue.ai_summary, cached: true })
    }

    // Generate summary using AI (mock for now, replace with actual AI call)
    // In production, call OpenAI/Anthropic API here
    const summary = await generateSummary(body.description)

    // Cache the result
    await supabase
      .from("issues")
      .update({ ai_summary: summary })
      .eq("id", body.issueId)

    return successResponse({ summary, cached: false })
  } catch (error) {
    return handleApiError(error)
  }
}

async function generateSummary(description: string): Promise<string> {
  // TODO: Replace with actual AI API call
  // Example with OpenAI:
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     { role: "system", content: "Summarize the following issue description in 2-4 sentences." },
  //     { role: "user", content: description }
  //   ],
  //   max_tokens: 200
  // })
  // return response.choices[0].message.content

  // Mock implementation
  const sentences = description.split(/[.!?]+/).filter((s) => s.trim())
  if (sentences.length <= 2) {
    return description.trim()
  }
  return sentences.slice(0, 2).join(". ").trim() + "."
}

