import { NextRequest } from "next/server"
import { CommentVM, CommentForm } from "@/src/schemas/issue"
import { PaginatedResponse } from "@/src/schemas/common"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError, errorResponse } from "@/lib/api/response"

type RouteParams = { params: Promise<{ issueId: string }> }

const PaginatedComments = PaginatedResponse(CommentVM)

// GET /api/issues/:issueId/comments - List comments with pagination
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params
    const { supabase, user } = await requireAuth()

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20")
    const offset = (page - 1) * pageSize

    // Verify access
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("project:projects!inner(team_id)")
      .eq("id", issueId)
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

    // Get total count
    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("issue_id", issueId)
      .is("deleted_at", null)

    // Get comments
    const { data: comments, error } = await supabase
      .from("comments")
      .select(`
        *,
        author:profiles!inner(id, name, profile_image)
      `)
      .eq("issue_id", issueId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) throw error

    const items = (comments || []).map((c) => {
      const author = c.author as any
      return CommentVM.parse({
        id: c.id,
        issueId: c.issue_id,
        authorId: c.author_id,
        content: c.content,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        author: {
          id: author.id,
          name: author.name,
          profileImage: author.profile_image,
        },
      })
    })

    const result = PaginatedComments.parse({
      items,
      total: count || 0,
      page,
      pageSize,
      hasMore: offset + pageSize < (count || 0),
    })

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/issues/:issueId/comments - Create comment
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { issueId } = await params
    const { supabase, user } = await requireAuth()
    const body = CommentForm.parse(await req.json())

    // Verify access
    const { data: issue, error: issueError } = await supabase
      .from("issues")
      .select("project:projects!inner(team_id)")
      .eq("id", issueId)
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

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        issue_id: issueId,
        author_id: user.id,
        content: body.content,
      })
      .select(`
        *,
        author:profiles!inner(id, name, profile_image)
      `)
      .single()

    if (error) throw error

    const author = comment.author as any
    const result = CommentVM.parse({
      id: comment.id,
      issueId: comment.issue_id,
      authorId: comment.author_id,
      content: comment.content,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: {
        id: author.id,
        name: author.name,
        profileImage: author.profile_image,
      },
    })

    return successResponse(result, 201)
  } catch (error) {
    return handleApiError(error)
  }
}

