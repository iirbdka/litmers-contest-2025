"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Search, Filter, SortAsc, Plus, X, AlertCircle } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IssueStatusBadge } from "@/components/issues/issue-status-badge"
import { PriorityBadge } from "@/components/issues/priority-badge"
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog"
import { useIssues } from "@/hooks/use-issues"
import type { ProjectVMType } from "@/src/schemas/project"

interface IssuesListProps {
  projectId: string
  project: ProjectVMType
}

type SortOption = "createdAt" | "dueDate" | "priority" | "updatedAt"

export function IssuesList({ projectId, project }: IssuesListProps) {
  const { data: issues, error, isLoading, mutate: mutateIssues } = useIssues(projectId)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("createdAt")
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const filteredAndSortedIssues = useMemo(() => {
    if (!issues) return []
    let result = [...issues]

    // Search
    if (searchQuery) {
      result = result.filter((issue) => issue.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((issue) => issue.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((issue) => issue.priority === priorityFilter)
    }

    // Assignee filter
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned") {
        result = result.filter((issue) => !issue.assignee)
      } else {
        result = result.filter((issue) => issue.assignee?.id === assigneeFilter)
      }
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "dueDate":
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case "priority":
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        case "updatedAt":
          const aUpdated = a.updatedAt || a.createdAt
          const bUpdated = b.updatedAt || b.createdAt
          return new Date(bUpdated).getTime() - new Date(aUpdated).getTime()
        default:
          return 0
      }
    })

    return result
  }, [issues, searchQuery, statusFilter, priorityFilter, assigneeFilter, sortBy])

  const uniqueAssignees = useMemo(() => {
    if (!issues) return []
    const assignees = issues.filter((i) => i.assignee).map((i) => i.assignee!)
    return [...new Map(assignees.map((a) => [a.id, a])).values()]
  }, [issues])

  const hasActiveFilters = statusFilter !== "all" || priorityFilter !== "all" || assigneeFilter !== "all"

  const clearFilters = () => {
    setStatusFilter("all")
    setPriorityFilter("all")
    setAssigneeFilter("all")
  }

  const handleIssueCreated = () => {
    mutateIssues()
    setIsCreateOpen(false)
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>이슈 목록을 불러오는데 실패했습니다.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>이슈 목록 ({filteredAndSortedIssues.length})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이슈 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Filter className="h-4 w-4" />
                    필터
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-1">
                        {[statusFilter, priorityFilter, assigneeFilter].filter((f) => f !== "all").length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">상태</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">모든 상태</SelectItem>
                          {project.customStatuses?.map((status) => (
                            <SelectItem key={status.id} value={status.name}>
                              {status.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">우선순위</label>
                      <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">모든 우선순위</SelectItem>
                          <SelectItem value="HIGH">높음</SelectItem>
                          <SelectItem value="MEDIUM">보통</SelectItem>
                          <SelectItem value="LOW">낮음</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">담당자</label>
                      <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">모든 담당자</SelectItem>
                          <SelectItem value="unassigned">미지정</SelectItem>
                          {uniqueAssignees.map((assignee) => (
                            <SelectItem key={assignee.id} value={assignee.id}>
                              {assignee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
                        <X className="mr-2 h-4 w-4" />
                        필터 초기화
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-[140px]">
                  <SortAsc className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">생성일</SelectItem>
                  <SelectItem value="dueDate">마감일</SelectItem>
                  <SelectItem value="priority">우선순위</SelectItem>
                  <SelectItem value="updatedAt">수정일</SelectItem>
                </SelectContent>
              </Select>

              {!project.isArchived && (
                <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  이슈 생성
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedIssues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {!issues || issues.length === 0 ? "아직 이슈가 없습니다" : "검색 결과가 없습니다"}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedIssues.map((issue) => (
                <Link
                  key={issue.id}
                  href={`/issues/${issue.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <PriorityBadge priority={issue.priority} size="sm" />
                      <span className="font-medium truncate">{issue.title}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <IssueStatusBadge status={issue.status} size="sm" />
                      {issue.labels.slice(0, 2).map((label) => (
                        <Badge
                          key={label.id}
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: `${label.color}20`, color: label.color }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                      {issue.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          마감: {format(new Date(issue.dueDate), "MM/dd")}
                        </span>
                      )}
                    </div>
                  </div>
                  {issue.assignee && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={issue.assignee.profileImage || undefined} />
                      <AvatarFallback className="text-xs">{issue.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateIssueDialog 
        open={isCreateOpen} 
        onOpenChange={setIsCreateOpen} 
        projectId={projectId} 
        onSuccess={handleIssueCreated}
      />
    </>
  )
}
