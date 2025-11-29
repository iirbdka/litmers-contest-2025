"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { UserPlus, UserMinus, Shield, FolderPlus, Archive, Edit, Loader2, AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTeamActivities } from "@/hooks/use-teams"

const actionConfig: Record<string, { icon: typeof UserPlus; label: string }> = {
  member_added: { icon: UserPlus, label: "멤버 추가" },
  member_removed: { icon: UserMinus, label: "멤버 제거" },
  role_changed: { icon: Shield, label: "역할 변경" },
  project_created: { icon: FolderPlus, label: "프로젝트 생성" },
  project_archived: { icon: Archive, label: "프로젝트 아카이브" },
  team_updated: { icon: Edit, label: "팀 정보 수정" },
}

interface TeamActivityTabProps {
  teamId: string
}

export function TeamActivityTab({ teamId }: TeamActivityTabProps) {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const { data, error, isLoading } = useTeamActivities(teamId, page, pageSize)

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>활동 로그를 불러오는데 실패했습니다.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>활동 로그</CardTitle>
          <CardDescription>팀 내 주요 활동 기록</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const logs = data?.items || []
  const hasMore = data?.hasMore || false

  return (
    <Card>
      <CardHeader>
        <CardTitle>활동 로그</CardTitle>
        <CardDescription>팀 내 주요 활동 기록</CardDescription>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">아직 활동 기록이 없습니다</div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const config = actionConfig[log.action] || { icon: Edit, label: log.action }
              const Icon = config.icon

              return (
                <div key={log.id} className="flex gap-3 pb-4 border-b last:border-0">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={log.actor.profileImage || undefined} />
                    <AvatarFallback>{log.actor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm">
                        <span className="font-medium">{log.actor.name}</span> 님이{" "}
                        <span className="font-medium">{log.target}</span> 을(를) {config.label}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ko })}
                    </p>
                  </div>
                </div>
              )
            })}

            {hasMore && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}더 보기
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
