"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Clock,
  History,
  MessageSquare,
  Loader2,
  MoreHorizontal,
  Trash2,
  AlertCircle,
  Pencil,
  Check,
  X,
} from "lucide-react"
import { mutate } from "swr"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { IssueStatusBadge } from "./issue-status-badge"
import { PriorityBadge } from "./priority-badge"
import { SubtaskList } from "./subtask-list"
import { CommentSection } from "./comment-section"
import { IssueHistory } from "./issue-history"
import { AISection } from "./ai-section"
import { useIssue, useUpdateIssue, useDeleteIssue } from "@/hooks/use-issues"
import { useProject, useLabels } from "@/hooks/use-projects"
import { useTeamMembers } from "@/hooks/use-teams"

interface IssueDetailContentProps {
  issueId: string
}

export function IssueDetailContent({ issueId }: IssueDetailContentProps) {
  const router = useRouter()
  const { data: issue, error, isLoading, mutate: mutateIssue } = useIssue(issueId)
  const { data: project } = useProject(issue?.projectId || null)
  const { data: teamMembers } = useTeamMembers(project?.teamId || null)
  const { data: allLabels } = useLabels(issue?.projectId || null)
  const { trigger: updateIssue, isMutating: isUpdating } = useUpdateIssue(issueId)
  const { trigger: deleteIssue, isMutating: isDeleting } = useDeleteIssue(issueId)

  // Editing states
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editDescription, setEditDescription] = useState("")
  const [isEditingDueDate, setIsEditingDueDate] = useState(false)
  const [editDueDate, setEditDueDate] = useState("")
  const [isEditingLabels, setIsEditingLabels] = useState(false)
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateIssue({ status: newStatus })
      mutateIssue()
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  const handlePriorityChange = async (newPriority: "HIGH" | "MEDIUM" | "LOW") => {
    try {
      await updateIssue({ priority: newPriority })
      mutateIssue()
    } catch (err) {
      console.error("Failed to update priority:", err)
    }
  }

  const handleAssigneeChange = async (userId: string) => {
    const actualUserId = userId === "__unassigned__" ? null : userId
    try {
      await updateIssue({ assigneeUserId: actualUserId })
      mutateIssue()
    } catch (err) {
      console.error("Failed to update assignee:", err)
    }
  }

  const handleDelete = async () => {
    if (!issue) return
    const projectId = issue.projectId
    try {
      await deleteIssue()
      setShowDeleteDialog(false)
      mutate(`/issues?projectId=${projectId}`)
      router.push(`/projects/${projectId}`)
    } catch (err) {
      console.error("Failed to delete issue:", err)
    }
  }

  const handleDescriptionSave = async () => {
    try {
      await updateIssue({ description: editDescription || null })
      mutateIssue()
      setIsEditingDescription(false)
    } catch (err) {
      console.error("Failed to update description:", err)
    }
  }

  const handleDueDateSave = async () => {
    try {
      const dueDate = editDueDate ? new Date(editDueDate + "T23:59:59.999Z").toISOString() : null
      await updateIssue({ dueDate })
      mutateIssue()
      setIsEditingDueDate(false)
    } catch (err) {
      console.error("Failed to update due date:", err)
    }
  }

  const handleLabelsSave = async () => {
    try {
      await updateIssue({ labelIds: selectedLabelIds })
      mutateIssue()
      setIsEditingLabels(false)
    } catch (err) {
      console.error("Failed to update labels:", err)
    }
  }

  const toggleLabelSelection = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : prev.length < 5
        ? [...prev, labelId]
        : prev
    )
  }

  const handleSubtasksUpdate = () => {
    mutateIssue()
  }

  const handleCommentsUpdate = () => {
    mutateIssue()
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>이슈 정보를 불러오는데 실패했습니다.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-muted-foreground">이슈를 찾을 수 없습니다</p>
        <Button variant="link" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              뒤로
            </Button>
            <span>/</span>
            <Link href={`/projects/${issue.projectId}`} className="hover:underline">
              프로젝트로 이동
            </Link>
          </div>
          <h1 className="text-2xl font-bold">{issue.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>생성: {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true, locale: ko })}</span>
            {issue.updatedAt && (
              <>
                <span>·</span>
                <span>수정: {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true, locale: ko })}</span>
              </>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MoreHorizontal className="h-5 w-5" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>이슈 수정</DropdownMenuItem>
            <DropdownMenuItem>복제</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-destructive"
              onSelect={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>이슈를 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 이슈와 관련된 모든 댓글, 서브태스크가 삭제됩니다.
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
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">설명</CardTitle>
              {!isEditingDescription && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditDescription(issue.description || "")
                    setIsEditingDescription(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={6}
                    placeholder="이슈에 대한 상세 설명을 입력하세요"
                    disabled={isUpdating}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDescription(false)}
                      disabled={isUpdating}
                    >
                      <X className="mr-1 h-4 w-4" />
                      취소
                    </Button>
                    <Button size="sm" onClick={handleDescriptionSave} disabled={isUpdating}>
                      {isUpdating ? (
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-1 h-4 w-4" />
                      )}
                      저장
                    </Button>
                  </div>
                </div>
              ) : issue.description ? (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {issue.description}
                </div>
              ) : (
                <p className="text-muted-foreground italic">설명이 없습니다</p>
              )}
            </CardContent>
          </Card>

          {/* AI Section */}
          <AISection issue={issue} onUpdate={() => mutateIssue()} />

          {/* Subtasks */}
          <SubtaskList
            subtasks={issue.subtasks}
            issueId={issueId}
            onUpdate={handleSubtasksUpdate}
          />

          {/* Tabs for Comments & History */}
          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                댓글 ({issue.comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                변경 기록
              </TabsTrigger>
            </TabsList>
            <TabsContent value="comments" className="mt-4">
              <CommentSection
                comments={issue.comments}
                issueId={issueId}
                onUpdate={handleCommentsUpdate}
              />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <IssueHistory history={issue.history} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">상세 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">상태</label>
                <Select value={issue.status} onValueChange={handleStatusChange} disabled={isUpdating}>
                  <SelectTrigger>
                    <SelectValue>
                      <IssueStatusBadge status={issue.status} />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {project?.customStatuses?.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    )) || (
                      <>
                        <SelectItem value="Backlog">Backlog</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">우선순위</label>
                <Select value={issue.priority} onValueChange={handlePriorityChange} disabled={isUpdating}>
                  <SelectTrigger>
                    <SelectValue>
                      <PriorityBadge priority={issue.priority} showLabel />
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">높음</SelectItem>
                    <SelectItem value="MEDIUM">보통</SelectItem>
                    <SelectItem value="LOW">낮음</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Assignee */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">담당자</label>
                <Select 
                  value={issue.assigneeUserId || "__unassigned__"} 
                  onValueChange={handleAssigneeChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="미지정">
                      {issue.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={issue.assignee.profileImage || undefined} />
                            <AvatarFallback className="text-xs">{issue.assignee.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {issue.assignee.name}
                        </div>
                      ) : (
                        "미지정"
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">미지정</SelectItem>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={member.user.profileImage || undefined} />
                            <AvatarFallback className="text-xs">{member.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {member.user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Due Date */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    마감일
                  </label>
                  {!isEditingDueDate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditDueDate(issue.dueDate ? format(new Date(issue.dueDate), "yyyy-MM-dd") : "")
                        setIsEditingDueDate(true)
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {isEditingDueDate ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="flex-1"
                      disabled={isUpdating}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsEditingDueDate(false)}
                      disabled={isUpdating}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleDueDateSave}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <p
                    className={`text-sm ${
                      issue.dueDate && new Date(issue.dueDate) < new Date() && issue.status !== "Done"
                        ? "text-red-500"
                        : ""
                    }`}
                  >
                    {issue.dueDate ? format(new Date(issue.dueDate), "yyyy년 MM월 dd일") : "미설정"}
                  </p>
                )}
              </div>

              {/* Labels */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    라벨
                  </label>
                  {!isEditingLabels && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setSelectedLabelIds(issue.labels.map((l) => l.id))
                        setIsEditingLabels(true)
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {isEditingLabels ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {allLabels?.map((label) => (
                        <Badge
                          key={label.id}
                          variant={selectedLabelIds.includes(label.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          style={
                            selectedLabelIds.includes(label.id)
                              ? { backgroundColor: label.color, borderColor: label.color }
                              : { borderColor: label.color, color: label.color }
                          }
                          onClick={() => toggleLabelSelection(label.id)}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedLabelIds.length}/5 선택됨
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingLabels(false)}
                        disabled={isUpdating}
                      >
                        <X className="mr-1 h-4 w-4" />
                        취소
                      </Button>
                      <Button size="sm" onClick={handleLabelsSave} disabled={isUpdating}>
                        {isUpdating ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-1 h-4 w-4" />
                        )}
                        저장
                      </Button>
                    </div>
                  </div>
                ) : issue.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {issue.labels.map((label) => (
                      <Badge
                        key={label.id}
                        variant="secondary"
                        style={{ backgroundColor: `${label.color}20`, color: label.color }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">없음</p>
                )}
              </div>

              <Separator />

              {/* Creator */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  생성자
                </label>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={issue.owner.profileImage || undefined} />
                    <AvatarFallback className="text-xs">{issue.owner.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{issue.owner.name}</span>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  생성일
                </label>
                <p className="text-sm">{format(new Date(issue.createdAt), "yyyy년 MM월 dd일 HH:mm")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
