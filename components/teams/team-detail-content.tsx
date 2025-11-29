"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, Users, Activity, FolderKanban, Trash2, Loader2, AlertCircle } from "lucide-react"
import { mutate } from "swr"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TeamOverviewTab } from "./team-overview-tab"
import { TeamMembersTab } from "./team-members-tab"
import { TeamActivityTab } from "./team-activity-tab"
import { TeamProjectsTab } from "./team-projects-tab"
import { useTeam, useTeamMembers, useDeleteTeam } from "@/hooks/use-teams"
import { useCurrentUser } from "@/hooks/use-auth"
import type { TeamType } from "@/src/schemas/team"

interface TeamDetailContentProps {
  teamId: string
}

export function TeamDetailContent({ teamId }: TeamDetailContentProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { data: user } = useCurrentUser()
  const { data: team, error: teamError, isLoading: teamLoading, mutate: mutateTeam } = useTeam(teamId)
  const { data: members, error: membersError, isLoading: membersLoading, mutate: mutateMembers } = useTeamMembers(teamId)
  const { trigger: deleteTeam, isMutating: isDeleting } = useDeleteTeam(teamId)

  const isLoading = teamLoading || membersLoading
  const error = teamError || membersError

  const currentMember = members?.find((m) => m.userId === user?.id)
  const isOwner = currentMember?.role === "OWNER"
  const isAdmin = currentMember?.role === "ADMIN"
  const canManage = isOwner || isAdmin

  const handleDelete = async () => {
    try {
      await deleteTeam()
      setShowDeleteDialog(false)
      mutate("/teams")
      router.push("/teams")
    } catch (err) {
      console.error("Failed to delete team:", err)
    }
  }

  const handleUpdateTeam = (updatedTeam: TeamType) => {
    mutateTeam()
  }

  const handleMembersUpdate = () => {
    mutateMembers()
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>팀 정보를 불러오는데 실패했습니다.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return <SkeletonCard />
  }

  if (!team) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">팀을 찾을 수 없습니다</p>
          <Button variant="link" onClick={() => router.push("/teams")}>
            팀 목록으로 돌아가기
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {currentMember && <Badge variant="outline">{currentMember.role}</Badge>}
          </div>
          <p className="text-muted-foreground">생성일: {new Date(team.createdAt).toLocaleDateString("ko-KR")}</p>
        </div>

        {isOwner && (
          <>
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />팀 삭제
            </Button>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>팀을 삭제하시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    이 작업은 되돌릴 수 없습니다. 팀과 관련된 모든 프로젝트, 이슈가 삭제됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    삭제
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Members</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            <span className="hidden sm:inline">Projects</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <TeamOverviewTab team={team as TeamType} canManage={canManage} onUpdate={handleUpdateTeam} />
          </TabsContent>
          <TabsContent value="members">
            <TeamMembersTab
              teamId={teamId}
              members={members || []}
              onMembersChange={handleMembersUpdate}
              currentMember={currentMember}
              isOwner={isOwner}
              canManage={canManage}
            />
          </TabsContent>
          <TabsContent value="activity">
            <TeamActivityTab teamId={teamId} />
          </TabsContent>
          <TabsContent value="projects">
            <TeamProjectsTab teamId={teamId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
