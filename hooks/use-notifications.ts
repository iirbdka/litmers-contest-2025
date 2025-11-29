import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { api, fetcher } from "@/lib/api/client"
import type { NotificationVMType } from "@/src/schemas"

// Notifications list
export function useNotifications(page = 1, pageSize = 20, unreadOnly = false) {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(unreadOnly && { unreadOnly: "true" }),
  })

  return useSWR<{
    items: NotificationVMType[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }>(`/notifications?${params.toString()}`, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })
}

// Unread count
export function useUnreadCount() {
  return useSWR<{ count: number }>("/notifications/unread-count", fetcher, {
    refreshInterval: 30000,
  })
}

// Mark as read
export function useMarkAsRead(notificationId: string) {
  return useSWRMutation(
    `/notifications/${notificationId}/read`,
    async (url: string) => {
      return api.post(url)
    }
  )
}

// Mark all as read
export function useMarkAllAsRead() {
  return useSWRMutation("/notifications/read-all", async (url: string) => {
    return api.post(url)
  })
}

