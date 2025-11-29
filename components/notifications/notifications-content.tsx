"use client"

import { Bell, MessageSquare, UserPlus, Clock, AlertCircle, Check, CheckCheck, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { mutate } from "swr"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/use-notifications"
import { api } from "@/lib/api/client"
import type { NotificationVMType } from "@/src/schemas/notification"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "assigned":
      return <UserPlus className="h-5 w-5 text-blue-500" />
    case "commented":
      return <MessageSquare className="h-5 w-5 text-green-500" />
    case "due_soon":
    case "due_today":
      return <Clock className="h-5 w-5 text-orange-500" />
    case "team_invite":
      return <UserPlus className="h-5 w-5 text-purple-500" />
    case "role_changed":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />
  }
}

const getNotificationLabel = (type: string) => {
  switch (type) {
    case "assigned":
      return "담당자 지정"
    case "commented":
      return "댓글"
    case "due_soon":
      return "마감 임박"
    case "due_today":
      return "오늘 마감"
    case "team_invite":
      return "팀 초대"
    case "role_changed":
      return "역할 변경"
    default:
      return "알림"
  }
}

export function NotificationsContent() {
  const { data, error, isLoading, mutate: mutateNotifications } = useNotifications(1, 50)
  const { trigger: markAllAsReadTrigger, isMutating: isMarkingAll } = useMarkAllAsRead()

  const notifications = data?.items || []
  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

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

  const NotificationItem = ({ notification }: { notification: NotificationVMType }) => (
    <div
      className={`flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${
        !notification.read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
      }`}
      onClick={() => !notification.read && handleMarkAsRead(notification.id)}
    >
      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs">
            {getNotificationLabel(notification.type)}
          </Badge>
          {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
        </div>
        <p className={`text-sm ${!notification.read ? "font-medium" : ""}`}>{notification.title}</p>
        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: ko,
          })}
        </p>
      </div>
      {!notification.read && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-shrink-0" 
          onClick={(e) => {
            e.stopPropagation()
            handleMarkAsRead(notification.id)
          }}
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">읽음 표시</span>
        </Button>
      )}
    </div>
  )

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>알림을 불러오는데 실패했습니다.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">알림</h1>
            <p className="text-muted-foreground">모든 알림을 확인하세요</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 border-b">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">알림</h1>
          <p className="text-muted-foreground">모든 알림을 확인하세요</p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} disabled={isMarkingAll}>
            {isMarkingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            모두 읽음 표시
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            전체{" "}
            <Badge variant="secondary" className="ml-2">
              {notifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread">
            읽지 않음{" "}
            <Badge variant="secondary" className="ml-2">
              {unreadNotifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="read">읽음</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">알림이 없습니다</p>
                  <p className="text-sm text-muted-foreground">새로운 알림이 오면 여기에 표시됩니다</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread">
          <Card>
            <CardContent className="p-0">
              {unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">모두 읽으셨네요!</p>
                  <p className="text-sm text-muted-foreground">읽지 않은 알림이 없습니다</p>
                </div>
              ) : (
                unreadNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="read">
          <Card>
            <CardContent className="p-0">
              {readNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">읽은 알림이 없습니다</p>
                </div>
              ) : (
                readNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
