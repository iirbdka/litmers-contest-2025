import { NextRequest } from "next/server"
import { z } from "zod"
import { Label } from "@/src/schemas/project"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"
import { checkAIRateLimit } from "../rate-limit"

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

    // Find matching labels using AI (mock for now)
    const suggestedLabels = await findMatchingLabels(
      body.title,
      body.description,
      labels
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

async function findMatchingLabels(
  title: string,
  description: string | null,
  labels: any[]
): Promise<any[]> {
  // TODO: Replace with actual AI API call
  // Mock implementation - simple keyword matching
  const text = `${title} ${description || ""}`.toLowerCase()
  
  const matches = labels.filter((label) => {
    const labelName = label.name.toLowerCase()
    return text.includes(labelName) || labelName.includes(text.split(" ")[0])
  })

  // If no matches, return first 2 labels as suggestions
  if (matches.length === 0 && labels.length > 0) {
    return labels.slice(0, 2)
  }

  return matches
}

