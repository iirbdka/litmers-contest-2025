"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Trash2, Archive, ArchiveRestore } from "lucide-react"
import { mutate } from "swr"

import { ProjectCreateForm, type ProjectCreateFormType, type ProjectVMType } from "@/src/schemas/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useUpdateProject, useDeleteProject } from "@/hooks/use-projects"

interface ProjectSettingsProps {
  project: ProjectVMType
  onUpdate: (project: ProjectVMType) => void
}

export function ProjectSettings({ project, onUpdate }: ProjectSettingsProps) {
  const router = useRouter()
  const { trigger: updateProject, isMutating: isUpdating } = useUpdateProject(project.id)
  const { trigger: deleteProject, isMutating: isDeleting } = useDeleteProject(project.id)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProjectCreateFormType>({
    resolver: zodResolver(ProjectCreateForm),
    defaultValues: {
      name: project.name,
      description: project.description || "",
    },
  })

  const handleFormSubmit = async (data: ProjectCreateFormType) => {
    try {
      await updateProject({
        name: data.name,
        description: data.description || undefined,
      })
      onUpdate({
        ...project,
        name: data.name,
        description: data.description || null,
      })
    } catch (err) {
      console.error("Failed to update project:", err)
    }
  }

  const handleArchive = async () => {
    try {
      await updateProject({ isArchived: !project.isArchived })
      onUpdate({ ...project, isArchived: !project.isArchived })
      mutate(`/projects?teamId=${project.teamId}`)
    } catch (err) {
      console.error("Failed to archive project:", err)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProject()
      mutate(`/projects?teamId=${project.teamId}`)
      router.push(`/teams/${project.teamId}`)
    } catch (err) {
      console.error("Failed to delete project:", err)
    }
  }

  const isLoading = isUpdating || isDeleting

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
          <CardDescription>프로젝트의 기본 정보를 수정합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">프로젝트 이름</Label>
              <Input id="name" {...register("name")} disabled={isLoading || project.isArchived} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="프로젝트에 대한 설명을 입력하세요"
                {...register("description")}
                disabled={isLoading || project.isArchived}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
              <p className="text-xs text-muted-foreground">최대 2000자</p>
            </div>
            <Button type="submit" disabled={isLoading || !isDirty || project.isArchived}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 관리</CardTitle>
          <CardDescription>아카이브 및 삭제</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">{project.isArchived ? "프로젝트 복원" : "프로젝트 아카이브"}</p>
              <p className="text-sm text-muted-foreground">
                {project.isArchived
                  ? "아카이브된 프로젝트를 다시 활성화합니다"
                  : "아카이브된 프로젝트는 읽기 전용이 됩니다"}
              </p>
            </div>
            <Button variant="outline" onClick={handleArchive} disabled={isLoading}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {project.isArchived ? (
                <>
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  복원
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  아카이브
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50">
            <div>
              <p className="font-medium text-destructive">프로젝트 삭제</p>
              <p className="text-sm text-muted-foreground">
                이 작업은 되돌릴 수 없습니다. 모든 이슈와 데이터가 삭제됩니다.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isLoading}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>프로젝트를 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. 프로젝트와 관련된 모든 이슈, 댓글이 영구적으로 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    삭제
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
