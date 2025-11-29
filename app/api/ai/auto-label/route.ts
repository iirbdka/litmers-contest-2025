import { NextRequest } from "next/server"
import { z } from "zod"
import { Label } from "@/src/schemas/project"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"
import { checkAIRateLimit } from "../rate-limit"
import { suggestLabels } from "@/lib/openai"

const AutoLabelBody = z.object({
  projectId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
})

// POST /api/ai/auto-label - AI-recommended labels (FR-043)
export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()
    const body = AutoLabelBody.parse(await req.json())

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

    // Get project labels
    const { data: labels, error: labelsError } = await supabase
      .from("labels")
      .select("*")
      .eq("project_id", body.projectId)
      .is("deleted_at", null)

    if (labelsError) throw labelsError

    if (!labels || labels.length === 0) {
      return successResponse({ labels: [] })
    }

    // Find matching labels using OpenAI
    const availableLabels = labels.map((l) => ({ id: l.id, name: l.name }))
    const suggestedLabelNames = await suggestLabels(body.title, body.description, availableLabels)

    // Find matching labels by name
    const suggestedLabels = labels.filter((l) =>
      suggestedLabelNames.some((name) => name.toLowerCase() === l.name.toLowerCase())
    )

    // Return max 3 labels
    const result = suggestedLabels.slice(0, 3).map((l) =>
      Label.parse({
        id: l.id,
        projectId: l.project_id,
        name: l.name,
        color: l.color,
      })
    )

    return successResponse({ labels: result })
  } catch (error) {
    return handleApiError(error)
  }
}

