"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { Crown, Shield, User, UserPlus, UserMinus, Loader2, MoreHorizontal } from "lucide-react"

import { TeamInviteForm, type TeamInviteFormType, type TeamMemberVMType } from "@/src/schemas/team"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSendInvite, useUpdateMemberRole, useRemoveMember } from "@/hooks/use-teams"
import { useCurrentUser } from "@/hooks/use-auth"

const roleConfig = {
  OWNER: { icon: Crown, label: "소유자", className: "bg-yellow-100 text-yellow-800" },
  ADMIN: { icon: Shield, label: "관리자", className: "bg-blue-100 text-blue-800" },
  MEMBER: { icon: User, label: "멤버", className: "bg-gray-100 text-gray-800" },
}

interface TeamMembersTabProps {
  teamId: string
  members: TeamMemberVMType[]
  onMembersChange: () => void
  currentMember?: TeamMemberVMType
  isOwner: boolean
  canManage: boolean
}

export function TeamMembersTab({
  teamId,
  members,
  onMembersChange,
  currentMember,
  isOwner,
  canManage,
}: TeamMembersTabProps) {
  const { data: currentUser } = useCurrentUser()
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const { trigger: sendInvite, isMutating: isInviting } = useSendInvite(teamId)
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamInviteFormType>({
    resolver: zodResolver(TeamInviteForm),
  })

  const handleInvite = async (data: TeamInviteFormType) => {
    try {
      await sendInvite({ email: data.email })
      reset()
      setIsInviteOpen(false)
    } catch (err) {
      console.error("Failed to send invite:", err)
    }
  }

  const handleRoleChange = async (memberId: string, newRole: "ADMIN" | "MEMBER") => {
    setUpdatingMemberId(memberId)
    try {
      const { trigger } = useUpdateMemberRole(teamId, memberId)
      await trigger({ role: newRole })
      onMembersChange()
    } catch (err) {
      console.error("Failed to update role:", err)
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const handleKick = async (memberId: string) => {
    setUpdatingMemberId(memberId)
    try {
      const { trigger } = useRemoveMember(teamId, memberId)
      await trigger()
      onMembersChange()
    } catch (err) {
      console.error("Failed to remove member:", err)
    } finally {
      setUpdatingMemberId(null)
    }
  }

  const handleTransferOwnership = async (memberId: string) => {
    setUpdatingMemberId(memberId)
    try {
      const { trigger } = useUpdateMemberRole(teamId, memberId)
      await trigger({ role: "OWNER" })
      onMembersChange()
    } catch (err) {
      console.error("Failed to transfer ownership:", err)
    } finally {
      setUpdatingMemberId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>팀 멤버</CardTitle>
            <CardDescription>{members.length}명의 멤버</CardDescription>
          </div>
          {canManage && (
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="mr-2 h-4 w-4" />
                  멤버 초대
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>멤버 초대</DialogTitle>
                  <DialogDescription>이메일 주소로 팀에 멤버를 초대하세요. 초대는 7일간 유효합니다.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(handleInvite)}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">이메일 주소</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        {...register("email")}
                        disabled={isInviting}
                      />
                      {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                      취소
                    </Button>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      초대 보내기
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => {
            const role = roleConfig[member.role]
            const RoleIcon = role.icon
            const canEditMember = isOwner || (canManage && member.role === "MEMBER" && member.userId !== currentUser?.id)
            const isCurrentUser = member.userId === currentUser?.id
            const isUpdating = updatingMemberId === member.id

            return (
              <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.user.profileImage || undefined} />
                    <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.user.name}</p>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          나
                        </Badge>
                      )}
                    </div>
                    {member.user.email && (
                      <p className="text-sm text-muted-foreground">{member.user.email}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      가입: {formatDistanceToNow(new Date(member.joinedAt), { addSuffix: true, locale: ko })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={role.className}>
                    <RoleIcon className="mr-1 h-3 w-3" />
                    {role.label}
                  </Badge>

                  {canEditMember && !isCurrentUser && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isUpdating}>
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && member.role !== "OWNER" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(member.id, member.role === "ADMIN" ? "MEMBER" : "ADMIN")}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              {member.role === "ADMIN" ? "멤버로 변경" : "관리자로 변경"}
                            </DropdownMenuItem>
                            {member.role === "ADMIN" && (
                              <DropdownMenuItem onClick={() => handleTransferOwnership(member.id)}>
                                <Crown className="mr-2 h-4 w-4" />
                                소유권 이전
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem className="text-destructive" onClick={() => handleKick(member.id)}>
                          <UserMinus className="mr-2 h-4 w-4" />
                          강제 퇴장
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
