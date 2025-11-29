"use client"

import { useState } from "react"
import Link from "next/link"
import { FolderKanban, Plus, Star, Archive, AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useProjects } from "@/hooks/use-projects"

interface TeamProjectsTabProps {
  teamId: string
}

export function TeamProjectsTab({ teamId }: TeamProjectsTabProps) {
  const { data: projects, error, isLoading } = useProjects(teamId)
  const [showArchived, setShowArchived] = useState(false)

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>프로젝트 목록을 불러오는데 실패했습니다.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>프로젝트</CardTitle>
          <CardDescription>팀의 프로젝트 목록</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const projectList = projects || []
  const filteredProjects = showArchived ? projectList : projectList.filter((p) => !p.isArchived)
  const activeCount = projectList.filter((p) => !p.isArchived).length
  const archivedCount = projectList.filter((p) => p.isArchived).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>프로젝트</CardTitle>
            <CardDescription>
              활성 {activeCount}개 · 아카이브 {archivedCount}개
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showArchived ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              <Archive className="mr-2 h-4 w-4" />
              아카이브 {showArchived ? "숨기기" : "보기"}
            </Button>
            <Link href={`/projects/new?teamId=${teamId}`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                프로젝트 생성
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {showArchived ? "프로젝트가 없습니다" : "활성 프로젝트가 없습니다"}
            </p>
            <Link href={`/projects/new?teamId=${teamId}`}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />첫 프로젝트 만들기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{project.name}</p>
                    {project.isFavorite && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                    {project.isArchived && <Badge variant="secondary">아카이브</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{project.issueCount}개 이슈</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
