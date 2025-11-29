"use client"

import { useRouter } from "next/navigation"
import { Kanban, List, Settings, BarChart3, Star, Archive, MoreHorizontal, AlertCircle, Loader2 } from "lucide-react"
import { mutate } from "swr"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KanbanBoard } from "./kanban-board"
import { IssuesList } from "./issues-list"
import { ProjectSettings } from "./project-settings"
import { ProjectDashboardTab } from "./project-dashboard-tab"
import { useProject, useUpdateProject, useToggleFavorite } from "@/hooks/use-projects"
import type { ProjectVMType } from "@/src/schemas/project"

interface ProjectDetailContentProps {
  projectId: string
}

export function ProjectDetailContent({ projectId }: ProjectDetailContentProps) {
  const router = useRouter()
  const { data: project, error, isLoading, mutate: mutateProject } = useProject(projectId)
  const { trigger: updateProject, isMutating: isUpdating } = useUpdateProject(projectId)
  const { trigger: toggleFavoriteAction, isMutating: isTogglingFavorite } = useToggleFavorite(projectId)

  const toggleFavorite = async () => {
    if (!project) return
    try {
      await toggleFavoriteAction({ isFavorite: project.isFavorite ?? false })
      mutateProject()
    } catch (err) {
      console.error("Failed to toggle favorite:", err)
    }
  }

  const toggleArchive = async () => {
    if (!project) return
    try {
      await updateProject({ isArchived: !project.isArchived })
      mutateProject()
    } catch (err) {
      console.error("Failed to toggle archive:", err)
    }
  }

  const handleProjectUpdate = (updatedProject: ProjectVMType) => {
    mutateProject()
    mutate(`/projects?teamId=${project?.teamId}`)
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>프로젝트 정보를 불러오는데 실패했습니다.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <SkeletonCard />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다</p>
        <Button variant="link" onClick={() => router.push("/teams")}>
          팀 목록으로 돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 md:p-6">
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                {project.isFavorite && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
                {project.isArchived && <Badge variant="secondary">아카이브</Badge>}
              </div>
              {project.description && (
                <p className="text-muted-foreground text-sm mt-1 line-clamp-1">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFavorite}
              disabled={isTogglingFavorite}
            >
              {isTogglingFavorite ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Star className={`h-5 w-5 ${project.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
              )}
              <span className="sr-only">즐겨찾기</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isUpdating}>
                  {isUpdating ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={toggleFavorite}>
                  <Star className="mr-2 h-4 w-4" />
                  {project.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  {project.isArchived ? "아카이브 해제" : "아카이브"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="board" className="px-4 md:px-6">
          <TabsList>
            <TabsTrigger value="board" className="gap-2">
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">Board</span>
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">Issues</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <div className="py-6">
            <TabsContent value="board" className="mt-0">
              <KanbanBoard projectId={projectId} project={project} isArchived={project.isArchived} />
            </TabsContent>
            <TabsContent value="issues" className="mt-0">
              <IssuesList projectId={projectId} project={project} />
            </TabsContent>
            <TabsContent value="dashboard" className="mt-0">
              <ProjectDashboardTab projectId={projectId} />
            </TabsContent>
            <TabsContent value="settings" className="mt-0">
              <ProjectSettings project={project} onUpdate={handleProjectUpdate} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
