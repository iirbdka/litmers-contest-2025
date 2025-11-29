"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Edit } from "lucide-react"

import { TeamCreateForm, type TeamCreateFormType, type TeamType } from "@/src/schemas/team"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUpdateTeam } from "@/hooks/use-teams"

interface TeamOverviewTabProps {
  team: TeamType
  canManage: boolean
  onUpdate: (team: TeamType) => void
}

export function TeamOverviewTab({ team, canManage, onUpdate }: TeamOverviewTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { trigger: updateTeam, isMutating: isLoading } = useUpdateTeam(team.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamCreateFormType>({
    resolver: zodResolver(TeamCreateForm),
    defaultValues: { name: team.name },
  })

  const handleFormSubmit = async (data: TeamCreateFormType) => {
    try {
      await updateTeam({ name: data.name })
      onUpdate({ ...team, name: data.name })
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to update team:", err)
    }
  }

  const handleCancel = () => {
    reset({ name: team.name })
    setIsEditing(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>팀 정보</CardTitle>
            <CardDescription>팀의 기본 정보를 확인하고 수정하세요</CardDescription>
          </div>
          {canManage && !isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              수정
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">팀 이름</Label>
              <Input id="name" {...register("name")} disabled={isLoading} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                저장
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                취소
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">팀 이름</Label>
              <p className="text-lg font-medium">{team.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">생성일</Label>
              <p>
                {new Date(team.createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
