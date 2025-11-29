"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, MessageSquare, UserPlus, Clock, AlertCircle, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { mutate } from "swr"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications, useUnreadCount, useMarkAllAsRead } from "@/hooks/use-notifications"
import { api } from "@/lib/api/client"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "assigned":
      return <UserPlus className="h-4 w-4 text-blue-500" />
    case "commented":
      return <MessageSquare className="h-4 w-4 text-green-500" />
    case "due_soon":
    case "due_today":
      return <Clock className="h-4 w-4 text-orange-500" />
    case "team_invite":
      return <UserPlus className="h-4 w-4 text-purple-500" />
    default:
      return <AlertCircle className="h-4 w-4 text-gray-500" />
  }
}

export function NotificationDropdown() {
  const [mounted, setMounted] = useState(false)
  const { data: unreadData } = useUnreadCount()
  const { data: notificationsData, isLoading, mutate: mutateNotifications } = useNotifications(1, 10)
  const { trigger: markAllAsReadTrigger, isMutating: isMarkingAll } = useMarkAllAsRead()

  useEffect(() => {
    setMounted(true)
  }, [])

  const unreadCount = unreadData?.count || 0
  const notifications = notificationsData?.items || []

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`)
      mutateNotifications()
      mutate("/notifications/unread-count")
    } catch (err) {
      console.error("Failed to mark as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadTrigger()
      mutateNotifications()
      mutate("/notifications/unread-count")
    } catch (err) {
      console.error("Failed to mark all as read:", err)
    }
  }

  // Prevent hydration mismatch by only rendering dropdown after mount
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="sr-only">알림</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">알림</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>알림</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAll}
            >
              {isMarkingAll ? <Loader2 className="h-3 w-3 animate-spin" /> : "모두 읽음 표시"}
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-2 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <Skeleton className="h-4 w-4 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">알림이 없습니다</div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                asChild
              >
                <Link href={notification.link || "#"}>
                  <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>{notification.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  </div>
                  {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="justify-center">
          <Link href="/notifications" className="text-sm text-center w-full">
            모든 알림 보기
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
