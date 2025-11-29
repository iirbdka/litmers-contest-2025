"use client"

import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Pie, PieChart, Bar, BarChart, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts"
import { AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PriorityBadge } from "@/components/issues/priority-badge"
import { IssueStatusBadge } from "@/components/issues/issue-status-badge"
import { useProjectDashboard } from "@/hooks/use-dashboard"

interface ProjectDashboardTabProps {
  projectId: string
}

const COLORS = {
  Backlog: "#6B7280",
  "In Progress": "#3B82F6",
  Review: "#F59E0B",
  Testing: "#8B5CF6",
  Done: "#10B981",
}

const PRIORITY_COLORS = {
  HIGH: "#EF4444",
  MEDIUM: "#F59E0B",
  LOW: "#10B981",
}

export function ProjectDashboardTab({ projectId }: ProjectDashboardTabProps) {
  const { data: dashboard, error, isLoading } = useProjectDashboard(projectId)

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!dashboard) return null

  const statusChartData = dashboard.statusCounts.map((s) => ({
    name: s.status,
    value: s.count,
    fill: COLORS[s.status as keyof typeof COLORS] || s.color || "#6B7280",
  }))

  const priorityChartData = dashboard.priorityCounts.map((p) => ({
    name: p.priority,
    value: p.count,
    fill: PRIORITY_COLORS[p.priority],
  }))

  const totalIssues = dashboard.statusCounts.reduce((acc, s) => acc + s.count, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 이슈</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssues}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">완료율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.completionRate.toFixed(0)}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${dashboard.completionRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">진행 중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.statusCounts.find((s) => s.status === "In Progress")?.count || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">마감 임박</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{dashboard.upcomingIssues.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>상태별 이슈</CardTitle>
            <CardDescription>현재 이슈 상태 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(Object.entries(COLORS).map(([key, color]) => [key, { label: key, color }]))}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>우선순위별 이슈</CardTitle>
            <CardDescription>우선순위 분포</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                HIGH: { label: "높음", color: PRIORITY_COLORS.HIGH },
                MEDIUM: { label: "보통", color: PRIORITY_COLORS.MEDIUM },
                LOW: { label: "낮음", color: PRIORITY_COLORS.LOW },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={60} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" radius={4}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent & Upcoming Issues */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>최근 생성 이슈</CardTitle>
            <CardDescription>최근 5개</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recentIssues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">아직 이슈가 없습니다</div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <PriorityBadge priority={issue.priority} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{issue.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <IssueStatusBadge status={issue.status} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true, locale: ko })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>마감 임박 이슈</CardTitle>
            <CardDescription>7일 이내</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingIssues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">마감 임박 이슈가 없습니다</div>
            ) : (
              <div className="space-y-3">
                {dashboard.upcomingIssues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <PriorityBadge priority={issue.priority} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{issue.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <IssueStatusBadge status={issue.status} size="sm" />
                        {issue.dueDate && (
                          <span className="text-xs text-orange-500">
                            {format(new Date(issue.dueDate), "MM/dd")} 마감
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
