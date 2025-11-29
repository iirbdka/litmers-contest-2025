"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2, FolderPlus } from "lucide-react"
import Link from "next/link"

import { ProjectCreateForm, type ProjectCreateFormType } from "@/src/schemas/project"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useCreateProject } from "@/hooks/use-projects"
import { useTeam } from "@/hooks/use-teams"

interface CreateProjectContentProps {
  teamId?: string
}

export function CreateProjectContent({ teamId }: CreateProjectContentProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const { data: team, isLoading: isTeamLoading } = useTeam(teamId || null)
  const { trigger: createProject, isMutating: isCreating } = useCreateProject()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProjectCreateFormType>({
    resolver: zodResolver(ProjectCreateForm),
  })

  const onSubmit = async (data: ProjectCreateFormType) => {
    if (!teamId) {
      setError("팀을 선택해주세요")
      return
    }

    setError(null)
    try {
      const result = await createProject({
        ...data,
        teamId,
      })
      if (result) {
        router.push(`/projects/${result.id}`)
      }
    } catch (err) {
      console.error("Failed to create project:", err)
      setError("프로젝트 생성에 실패했습니다")
    }
  }

  if (!teamId) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertDescription>팀 ID가 필요합니다. 팀 페이지에서 프로젝트를 생성해주세요.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            뒤로
          </Button>
          <span>/</span>
          {team && (
            <Link href={`/teams/${teamId}`} className="hover:underline">
              {team.name}
            </Link>
          )}
        </div>
        <h1 className="text-2xl font-bold">새 프로젝트 생성</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            프로젝트 정보
          </CardTitle>
          <CardDescription>
            {team ? `'${team.name}' 팀에 새 프로젝트를 생성합니다` : "새 프로젝트의 기본 정보를 입력하세요"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">프로젝트 이름 *</Label>
              <Input
                id="name"
                placeholder="프로젝트 이름을 입력하세요"
                {...register("name")}
                disabled={isCreating}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                placeholder="프로젝트에 대한 설명을 입력하세요 (선택사항)"
                rows={4}
                {...register("description")}
                disabled={isCreating}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isCreating}
              >
                취소
              </Button>
              <Button type="submit" disabled={isCreating || isTeamLoading}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                프로젝트 생성
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

