import { NextRequest } from "next/server"
import { NotificationVM, NotificationType } from "@/src/schemas/notification"
import { PaginatedResponse } from "@/src/schemas/common"
import { requireAuth } from "@/lib/api/auth"
import { successResponse, handleApiError } from "@/lib/api/response"

const PaginatedNotifications = PaginatedResponse(NotificationVM)

// Helper to format notification message
function formatNotification(notification: any): { title: string; message: string; link?: string } {
  const type = notification.type
  const payload = notification.payload || {}

  switch (type) {
    case "assigned":
      return {
        title: "이슈가 할당되었습니다",
        message: `"${payload.issueTitle}" 이슈가 당신에게 할당되었습니다.`,
        link: `/issues/${payload.issueId}`,
      }
    case "commented":
      return {
        title: "새 댓글",
        message: `"${payload.issueTitle}" 이슈에 새 댓글이 달렸습니다.`,
        link: `/issues/${payload.issueId}`,
      }
    case "due_soon":
      return {
        title: "마감 임박",
        message: `"${payload.issueTitle}" 이슈 마감일이 내일입니다.`,
        link: `/issues/${payload.issueId}`,
      }
    case "due_today":
      return {
        title: "오늘 마감",
        message: `"${payload.issueTitle}" 이슈 마감일이 오늘입니다.`,
        link: `/issues/${payload.issueId}`,
      }
    case "team_invite":
      return {
        title: "팀 초대",
        message: `"${payload.teamName}" 팀에 초대되었습니다.`,
        link: `/teams/${payload.teamId}`,
      }
    case "role_changed":
      return {
        title: "역할 변경",
        message: `팀에서의 역할이 ${payload.newRole}로 변경되었습니다.`,
        link: `/teams/${payload.teamId}`,
      }
    case "mentioned":
      return {
        title: "멘션됨",
        message: `"${payload.issueTitle}" 이슈에서 멘션되었습니다.`,
        link: `/issues/${payload.issueId}`,
      }
    default:
      return {
        title: "알림",
        message: "새 알림이 있습니다.",
      }
  }
}

// GET /api/notifications - List user notifications
export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth()

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20")
    const unreadOnly = url.searchParams.get("unreadOnly") === "true"
    const offset = (page - 1) * pageSize

    // Get total count
    let countQuery = supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (unreadOnly) {
      countQuery = countQuery.eq("read", false)
    }

    const { count } = await countQuery

    // Get notifications
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1)

    if (unreadOnly) {
      query = query.eq("read", false)
    }

    const { data: notifications, error } = await query

    if (error) throw error

    const items = (notifications || []).map((n) => {
      const formatted = formatNotification(n)
      return NotificationVM.parse({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        payload: n.payload,
        read: n.read,
        createdAt: n.created_at,
        title: formatted.title,
        message: formatted.message,
        link: formatted.link,
      })
    })

    const result = PaginatedNotifications.parse({
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

