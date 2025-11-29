"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Sparkles } from "lucide-react"

import { IssueCreateForm, type IssueCreateFormType } from "@/src/schemas/issue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useLabels } from "@/hooks/use-projects"
import { useCreateIssue } from "@/hooks/use-issues"
import { useTeamMembers } from "@/hooks/use-teams"
import { useProject } from "@/hooks/use-projects"
import { useAIAutoLabel } from "@/hooks/use-ai"

interface CreateIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  defaultStatus?: string
  onSuccess?: () => void
}

export function CreateIssueDialog({ open, onOpenChange, projectId, defaultStatus, onSuccess }: CreateIssueDialogProps) {
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  const { data: labels } = useLabels(projectId)
  const { data: project } = useProject(projectId)
  const { data: teamMembers } = useTeamMembers(project?.teamId || null)
  const { trigger: createIssue, isMutating: isLoading } = useCreateIssue()
  const { trigger: autoLabel, isMutating: isAutoLabeling } = useAIAutoLabel()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IssueCreateFormType>({
    resolver: zodResolver(IssueCreateForm),
    defaultValues: {
      priority: "MEDIUM",
    },
  })

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({ priority: "MEDIUM" })
      setSelectedLabels([])
    }
  }, [open, reset])

  const handleFormSubmit = async (data: IssueCreateFormType) => {
    try {
      // Convert date to ISO datetime string if provided
      let dueDate: string | null = null
      if (data.dueDate && typeof data.dueDate === 'string') {
        // HTML date input returns YYYY-MM-DD, convert to ISO datetime
        dueDate = new Date(data.dueDate + "T23:59:59.999Z").toISOString()
      }

      await createIssue({
        ...data,
        projectId,
        labelIds: selectedLabels,
        dueDate,
        assigneeUserId: data.assigneeUserId === "__unassigned__" ? null : data.assigneeUserId,
      })
      reset()
      setSelectedLabels([])
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to create issue:", err)
    }
  }

  const handleAutoLabel = async () => {
    const title = watch("title")
    const description = watch("description")
    if (!title) return

    try {
      const result = await autoLabel({
        projectId,
        title,
        description: description || null,
      })
      if (result?.labels) {
        setSelectedLabels(result.labels.slice(0, 3).map((l) => l.id))
      }
    } catch (err) {
      console.error("Failed to auto-label:", err)
    }
  }

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : prev.length < 5 ? [...prev, labelId] : prev,
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>새 이슈 생성</DialogTitle>
          <DialogDescription>이슈의 상세 정보를 입력하세요</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input id="title" placeholder="이슈 제목을 입력하세요" {...register("title")} disabled={isLoading} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="이슈에 대한 상세 설명을 입력하세요"
                {...register("description")}
                disabled={isLoading}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>우선순위</Label>
                <Select
                  value={watch("priority") || "MEDIUM"}
                  onValueChange={(v) => setValue("priority", v as "HIGH" | "MEDIUM" | "LOW")}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">높음</SelectItem>
                    <SelectItem value="MEDIUM">보통</SelectItem>
                    <SelectItem value="LOW">낮음</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>담당자</Label>
                <Select
                  value={watch("assigneeUserId") || "__unassigned__"}
                  onValueChange={(v) => setValue("assigneeUserId", v)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned__">미지정</SelectItem>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">마감일</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>라벨 (최대 5개)</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={handleAutoLabel}
                  disabled={isAutoLabeling || !watch("title")}
                >
                  {isAutoLabeling ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1 h-3 w-3" />
                  )}
                  AI 추천
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {labels?.map((label) => (
                  <Badge
                    key={label.id}
                    variant={selectedLabels.includes(label.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    style={
                      selectedLabels.includes(label.id)
                        ? { backgroundColor: label.color, borderColor: label.color }
                        : { borderColor: label.color, color: label.color }
                    }
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
