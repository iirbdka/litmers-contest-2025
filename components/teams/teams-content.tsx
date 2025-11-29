"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Users, FolderKanban, Crown, Shield, User, AlertCircle } from "lucide-react"
import { mutate } from "swr"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreateTeamDialog } from "./create-team-dialog"
import { useTeams, useCreateTeam } from "@/hooks/use-teams"
import type { TeamVMType } from "@/src/schemas/team"

const roleConfig = {
  OWNER: { icon: Crown, label: "소유자", className: "bg-yellow-100 text-yellow-800" },
  ADMIN: { icon: Shield, label: "관리자", className: "bg-blue-100 text-blue-800" },
  MEMBER: { icon: User, label: "멤버", className: "bg-gray-100 text-gray-800" },
}

export function TeamsContent() {
  const { data: teams, error, isLoading } = useTeams()
  const { trigger: createTeam, isMutating: isCreating } = useCreateTeam()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleCreateTeam = async (name: string) => {
    try {
      await createTeam({ name })
      mutate("/teams")
      setIsCreateOpen(false)
    } catch (err) {
      console.error("Failed to create team:", err)
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>팀 목록을 불러오는데 실패했습니다. 다시 시도해주세요.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">내 팀</h1>
            <p className="text-muted-foreground">소속된 팀을 관리하세요</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">내 팀</h1>
          <p className="text-muted-foreground">소속된 팀을 관리하세요</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />팀 만들기
        </Button>
      </div>

      {!teams || teams.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">아직 소속된 팀이 없습니다</h3>
            <p className="text-sm text-muted-foreground mb-4">팀을 만들어 협업을 시작하세요</p>
            <Button onClick={() => setIsCreateOpen(true)} disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />첫 팀 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            const role = roleConfig[team.myRole]
            const RoleIcon = role.icon
            return (
              <Card key={team.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <CardDescription>생성일: {new Date(team.createdAt).toLocaleDateString("ko-KR")}</CardDescription>
                    </div>
                    <Badge variant="secondary" className={role.className}>
                      <RoleIcon className="mr-1 h-3 w-3" />
                      {role.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{team.memberCount}명</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FolderKanban className="h-4 w-4" />
                      <span>{team.projectCount}개 프로젝트</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/teams/${team.id}`} className="w-full">
                    <Button variant="outline" className="w-full bg-transparent">
                      팀 관리
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <CreateTeamDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onSubmit={handleCreateTeam} />
    </>
  )
}
