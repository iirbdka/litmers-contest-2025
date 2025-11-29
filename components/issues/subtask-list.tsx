"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, GripVertical, Trash2, Loader2, Pencil, Check, X } from "lucide-react"

import { SubtaskForm, type SubtaskFormType, type SubtaskType } from "@/src/schemas/issue"
import { LIMITS } from "@/src/schemas/validators"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from "@/hooks/use-issues"
import { api } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface SubtaskListProps {
  subtasks: SubtaskType[]
  issueId: string
  onUpdate: () => void
}

export function SubtaskList({ subtasks, issueId, onUpdate }: SubtaskListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const { trigger: createSubtask, isMutating: isCreating } = useCreateSubtask(issueId)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubtaskFormType>({
    resolver: zodResolver(SubtaskForm),
  })

  const completedCount = subtasks.filter((s) => s.done).length
  const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0

  const handleAdd = async (data: SubtaskFormType) => {
    if (subtasks.length >= LIMITS.ISSUE_MAX_SUBTASKS) return

    try {
      await createSubtask({ title: data.title })
      reset()
      setIsAdding(false)
      onUpdate()
    } catch (err) {
      console.error("Failed to create subtask:", err)
    }
  }

  const handleToggle = async (subtask: SubtaskType) => {
    setUpdatingId(subtask.id)
    try {
      await api.patch(`/issues/${issueId}/subtasks/${subtask.id}`, { done: !subtask.done })
      onUpdate()
    } catch (err) {
      console.error("Failed to update subtask:", err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await api.delete(`/issues/${issueId}/subtasks/${id}`)
      onUpdate()
    } catch (err) {
      console.error("Failed to delete subtask:", err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = subtasks.findIndex((s) => s.id === active.id)
    const newIndex = subtasks.findIndex((s) => s.id === over.id)

    const reorderedSubtasks = arrayMove(subtasks, oldIndex, newIndex).map((s, idx) => ({
      ...s,
      position: idx,
    }))

    // Optimistically update, then sync with server
    try {
      await api.patch(`/issues/${issueId}/subtasks/${active.id}`, { position: newIndex })
      onUpdate()
    } catch (err) {
      console.error("Failed to reorder subtask:", err)
      onUpdate() // Refresh to get correct order
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">서브태스크</CardTitle>
            <CardDescription>
              {completedCount}/{subtasks.length} 완료
            </CardDescription>
          </div>
          {subtasks.length < LIMITS.ISSUE_MAX_SUBTASKS && (
            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
              <Plus className="mr-2 h-4 w-4" />
              추가
            </Button>
          )}
        </div>
        {subtasks.length > 0 && <Progress value={progress} className="mt-2" />}
      </CardHeader>
      <CardContent>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={subtasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {subtasks.map((subtask) => (
                <SortableSubtask 
                  key={subtask.id} 
                  subtask={subtask} 
                  onToggle={() => handleToggle(subtask)} 
                  onDelete={() => handleDelete(subtask.id)}
                  onUpdateTitle={async (title) => {
                    await api.patch(`/issues/${issueId}/subtasks/${subtask.id}`, { title })
                    onUpdate()
                  }}
                  isUpdating={updatingId === subtask.id}
                  isDeleting={deletingId === subtask.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {isAdding && (
          <form onSubmit={handleSubmit(handleAdd)} className="mt-4 flex gap-2">
            <Input placeholder="새 서브태스크" {...register("title")} disabled={isCreating} autoFocus />
            <Button type="submit" disabled={isCreating}>
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "추가"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsAdding(false)
                reset()
              }}
            >
              취소
            </Button>
          </form>
        )}

        {subtasks.length === 0 && !isAdding && (
          <p className="text-sm text-muted-foreground text-center py-4">서브태스크가 없습니다</p>
        )}

        {subtasks.length >= LIMITS.ISSUE_MAX_SUBTASKS && (
          <p className="text-xs text-muted-foreground mt-2">
            서브태스크는 최대 {LIMITS.ISSUE_MAX_SUBTASKS}개까지 추가할 수 있습니다
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface SortableSubtaskProps {
  subtask: SubtaskType
  onToggle: () => void
  onDelete: () => void
  onUpdateTitle: (title: string) => Promise<void>
  isUpdating?: boolean
  isDeleting?: boolean
}

function SortableSubtask({ subtask, onToggle, onDelete, onUpdateTitle, isUpdating, isDeleting }: SortableSubtaskProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(subtask.title)
  const [isSaving, setIsSaving] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subtask.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleSave = async () => {
    if (!editTitle.trim()) return
    setIsSaving(true)
    try {
      await onUpdateTitle(editTitle.trim())
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to update subtask title:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSave()
    } else if (e.key === "Escape") {
      setEditTitle(subtask.title)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-2 p-2 rounded-lg border bg-background", isDragging && "opacity-50")}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {isUpdating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Checkbox checked={subtask.done} onCheckedChange={onToggle} />
      )}
      {isEditing ? (
        <div className="flex-1 flex gap-1 items-center">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 text-sm"
            autoFocus
            disabled={isSaving}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => {
              setEditTitle(subtask.title)
              setIsEditing(false)
            }}
            disabled={isSaving}
          >
            <X className="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            className="h-6 w-6"
            onClick={handleSave}
            disabled={isSaving || !editTitle.trim()}
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          </Button>
        </div>
      ) : (
        <>
          <span
            className={cn("flex-1 text-sm cursor-pointer hover:bg-muted/50 rounded px-1", subtask.done && "line-through text-muted-foreground")}
            onDoubleClick={() => {
              setEditTitle(subtask.title)
              setIsEditing(true)
            }}
          >
            {subtask.title}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditTitle(subtask.title)
              setIsEditing(true)
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-destructive"
        onClick={onDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Trash2 className="h-3 w-3" />
        )}
      </Button>
    </div>
  )
}
