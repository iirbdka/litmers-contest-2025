"use client"

import Link from "next/link"
import { formatDistanceToNow, format } from "date-fns"
import { ko } from "date-fns/locale"
import { ListTodo, Clock, AlertTriangle, MessageSquare, Users, FolderKanban, AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IssueStatusBadge } from "@/components/issues/issue-status-badge"
import { PriorityBadge } from "@/components/issues/priority-badge"
import { usePersonalDashboard } from "@/hooks/use-dashboard"

export function DashboardContent() {
  const { data: dashboard, error, isLoading } = usePersonalDashboard()

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>대시보드 데이터를 불러오는데 실패했습니다.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">내 이슈</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.myIssues.total}</div>
            <p className="text-xs text-muted-foreground">
              진행 중 {dashboard.myIssues.byStatus.find((s) => s.status === "In Progress")?.count || 0}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">마감 임박</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.upcomingIssues.length}</div>
            <p className="text-xs text-muted-foreground">7일 이내 마감</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">오늘 마감</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{dashboard.todayIssues.length}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard.todayIssues.length > 0 ? "긴급 처리 필요" : "여유 있어요!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">팀 / 프로젝트</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.teams.length} / {dashboard.projects.length}
            </div>
            <p className="text-xs text-muted-foreground">소속 팀 / 참여 프로젝트</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* My Issues by Status */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>내 이슈 현황</CardTitle>
            <CardDescription>상태별 할당된 이슈</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {dashboard.myIssues.byStatus
                  .filter((s) => s.count > 0)
                  .map((statusGroup) => (
                    <div key={statusGroup.status}>
                      <div className="flex items-center justify-between mb-2">
                        <IssueStatusBadge status={statusGroup.status} />
                        <Badge variant="secondary">{statusGroup.count}</Badge>
                      </div>
                      <div className="space-y-2">
                        {statusGroup.issues.slice(0, 3).map((issue) => (
                          <Link
                            key={issue.id}
                            href={`/issues/${issue.id}`}
                            className="block p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <PriorityBadge priority={issue.priority} size="sm" />
                              <span className="text-sm truncate flex-1">{issue.title}</span>
                            </div>
                            {issue.dueDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                마감: {format(new Date(issue.dueDate), "MM/dd")}
                              </p>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Upcoming Issues */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>마감 임박 이슈</CardTitle>
            <CardDescription>7일 이내 마감 예정</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              {dashboard.upcomingIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Clock className="h-12 w-12 mb-2 opacity-20" />
                  <p>마감 임박 이슈가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.upcomingIssues.map((issue) => (
                    <Link
                      key={issue.id}
                      href={`/issues/${issue.id}`}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={issue.priority} size="sm" />
                          <span className="text-sm font-medium truncate">{issue.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <IssueStatusBadge status={issue.status} size="sm" />
                          {issue.dueDate && (
                            <span className="text-xs text-orange-500">
                              {formatDistanceToNow(new Date(issue.dueDate), { addSuffix: true, locale: ko })}
                            </span>
                          )}
                        </div>
                      </div>
                      {issue.assignee && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={issue.assignee.profileImage || undefined} />
                          <AvatarFallback className="text-xs">{issue.assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>최근 작성한 댓글</CardTitle>
              <CardDescription>최근 5개</CardDescription>
            </div>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              {dashboard.recentComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                  <p>작성한 댓글이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.recentComments.map((comment) => (
                    <Link
                      key={comment.id}
                      href={`/issues/${comment.issueId}`}
                      className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-xs text-muted-foreground mb-1 truncate">{comment.issueTitle}</p>
                      <p className="text-sm line-clamp-2">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ko })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Teams & Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>내 팀 & 프로젝트</CardTitle>
              <CardDescription>소속 팀 및 참여 프로젝트</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {dashboard.teams.map((team) => (
                  <div key={team.id}>
                    <Link
                      href={`/teams/${team.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{team.name}</span>
                      <Badge variant="outline" className="ml-auto">
                        {team.myRole}
                      </Badge>
                    </Link>
                    <div className="ml-6 space-y-1">
                      {dashboard.projects
                        .filter((p) => p.teamId === team.id && !p.isArchived)
                        .slice(0, 3)
                        .map((project) => (
                          <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                          >
                            <FolderKanban className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{project.name}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{project.issueCount}개</span>
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
