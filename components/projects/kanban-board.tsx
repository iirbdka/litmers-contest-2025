"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import { snapCenterToCursor } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Plus, AlertTriangle, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { mutate } from "swr"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { PriorityBadge } from "@/components/issues/priority-badge"
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog"
import { useIssues, useUpdateIssue } from "@/hooks/use-issues"
import { api } from "@/lib/api/client"
import type { KanbanColumnType, IssueVMType } from "@/src/schemas/issue"
import type { ProjectVMType } from "@/src/schemas/project"
import { cn } from "@/lib/utils"

// Track pending column move (since React state updates are async)
interface PendingMove {
  issueId: string
  targetColumnName: string
  position: number
}

interface KanbanBoardProps {
  projectId: string
  project: ProjectVMType
  isArchived?: boolean
}

export function KanbanBoard({ projectId, project, isArchived }: KanbanBoardProps) {
  const { data: issues, isLoading, mutate: mutateIssues } = useIssues(projectId)
  const [columns, setColumns] = useState<KanbanColumnType[]>([])
  const [activeIssue, setActiveIssue] = useState<IssueVMType | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createColumnId, setCreateColumnId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const pendingMoveRef = useRef<PendingMove | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Build columns from project statuses and issues
  useEffect(() => {
    if (issues && project.customStatuses) {
      const cols: KanbanColumnType[] = project.customStatuses.map((status) => ({
        id: status.id,
        name: status.name,
        color: status.color,
        wipLimit: status.wipLimit,
        issues: issues
          .filter((issue) => issue.status === status.name)
          .sort((a, b) => a.position - b.position),
      }))
      setColumns(cols)
    }
  }, [issues, project.customStatuses])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeColumn = columns.find((col) => col.issues.some((issue) => issue.id === active.id))
    const issue = activeColumn?.issues.find((i) => i.id === active.id)
    setActiveIssue(issue || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the source column (where the issue is currently)
    const activeColumn = columns.find((col) => col.issues.some((issue) => issue.id === activeId))
    
    // Find the target column - could be a column ID directly or an issue within a column
    let overColumn = columns.find((col) => col.id === overId)
    if (!overColumn) {
      overColumn = columns.find((col) => col.issues.some((issue) => issue.id === overId))
    }

    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return

    // Track pending move in ref (sync, not async like state)
    const overIndex = overColumn.issues.findIndex((i) => i.id === overId)
    const newPosition = overIndex >= 0 ? overIndex : overColumn.issues.length

    pendingMoveRef.current = {
      issueId: activeId,
      targetColumnName: overColumn.name,
      position: newPosition,
    }

    setColumns((prev) => {
      const currentActiveColumn = prev.find((col) => col.issues.some((issue) => issue.id === activeId))
      const currentOverColumn = prev.find((col) => col.id === overColumn!.id)
      
      if (!currentActiveColumn || !currentOverColumn) return prev

      const activeIssues = [...currentActiveColumn.issues]
      const overIssues = [...currentOverColumn.issues]

      const activeIndex = activeIssues.findIndex((i) => i.id === activeId)
      if (activeIndex === -1) return prev
      
      const [movedIssue] = activeIssues.splice(activeIndex, 1)

      if (overIndex >= 0) {
        overIssues.splice(overIndex, 0, { ...movedIssue, status: currentOverColumn.name })
      } else {
        overIssues.push({ ...movedIssue, status: currentOverColumn.name })
      }

      return prev.map((col) => {
        if (col.id === currentActiveColumn.id) return { ...col, issues: activeIssues }
        if (col.id === currentOverColumn.id) return { ...col, issues: overIssues }
        return col
      })
    })
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveIssue(null)

    // Get pending move from ref (this is set synchronously in handleDragOver)
    const pendingMove = pendingMoveRef.current
    pendingMoveRef.current = null

    if (!over) return

    // If we have a pending move (cross-column), save it regardless of over.id
    if (pendingMove && pendingMove.issueId === (active.id as string)) {
      setIsSaving(true)
      try {
        await api.patch(`/issues/${pendingMove.issueId}`, {
          status: pendingMove.targetColumnName,
          position: pendingMove.position,
        })
        mutateIssues()
      } catch (err) {
        console.error("Failed to save issue status:", err)
        mutateIssues()
      } finally {
        setIsSaving(false)
      }
      return
    }

    // Check if dropped on a column directly (over.id is a column ID)
    const targetColumn = columns.find((col) => col.id === over.id)
    
    if (targetColumn) {
      // Dropped on a column - find which column the issue came from
      const sourceColumn = columns.find((col) => col.issues.some((issue) => issue.id === active.id))
      
      if (sourceColumn && sourceColumn.id !== targetColumn.id) {
        // Moving to a different column
        setIsSaving(true)
        try {
          await api.patch(`/issues/${active.id}`, {
            status: targetColumn.name,
            position: targetColumn.issues.length, // Add to the end
          })
          mutateIssues()
        } catch (err) {
          console.error("Failed to save issue status:", err)
          mutateIssues()
        } finally {
          setIsSaving(false)
        }
        return
      }
    }

    // Same item - no action needed
    if (active.id === over.id) return

    const activeColumn = columns.find((col) => col.issues.some((issue) => issue.id === active.id))

    if (!activeColumn) return

    const activeIndex = activeColumn.issues.findIndex((i) => i.id === active.id)
    const overIndex = activeColumn.issues.findIndex((i) => i.id === over.id)

    if (activeIndex !== -1 && overIndex !== -1) {
      // Reordering within the same column
      const newIssues = arrayMove(activeColumn.issues, activeIndex, overIndex).map((issue, idx) => ({
        ...issue,
        position: idx,
      }))

      setColumns((prev) =>
        prev.map((col) => {
          if (col.id !== activeColumn.id) return col
          return { ...col, issues: newIssues }
        }),
      )

      // Save to server
      setIsSaving(true)
      try {
        // Get the moved issue with its new status and position
        const movedIssue = newIssues.find((i) => i.id === active.id)
        if (movedIssue) {
          await api.patch(`/issues/${movedIssue.id}`, {
            status: movedIssue.status,
            position: movedIssue.position,
          })
        }
        mutateIssues()
      } catch (err) {
        console.error("Failed to save issue position:", err)
        // Revert on error
        mutateIssues()
      } finally {
        setIsSaving(false)
      }
    }
  }, [columns, mutateIssues])

  const handleCreateIssue = (columnId: string) => {
    setCreateColumnId(columnId)
    setIsCreateOpen(true)
  }

  const handleIssueCreated = () => {
    mutateIssues()
    setIsCreateOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-32 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      {isSaving && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-md border shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">저장 중...</span>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-4 pb-4">
            {columns.map((column) => {
              const isOverWipLimit = column.wipLimit && column.issues.length > column.wipLimit

              return (
                <div key={column.id} className="flex-shrink-0 w-80">
                  <Card className={cn(isOverWipLimit && "border-orange-500")}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: column.color || "#6B7280" }}
                          />
                          <CardTitle className="text-sm font-medium">{column.name}</CardTitle>
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", isOverWipLimit && "bg-orange-100 text-orange-800")}
                          >
                            {column.issues.length}
                            {column.wipLimit && `/${column.wipLimit}`}
                          </Badge>
                          {isOverWipLimit && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        </div>
                        {!isArchived && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCreateIssue(column.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <SortableContext items={column.issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        <DroppableColumn id={column.id}>
                          {column.issues.map((issue) => (
                            <SortableIssueCard key={issue.id} issue={issue} disabled={isArchived} />
                          ))}
                        </DroppableColumn>
                      </SortableContext>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeIssue && <IssueCard issue={activeIssue} isDragging />}
        </DragOverlay>
      </DndContext>

      <CreateIssueDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        projectId={projectId}
        defaultStatus={createColumnId || undefined}
        onSuccess={handleIssueCreated}
      />
    </>
  )
}

interface DroppableColumnProps {
  id: string
  children: React.ReactNode
}

function DroppableColumn({ id, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn("space-y-3 min-h-[200px] transition-colors", isOver && "bg-muted/50 rounded-lg")}
    >
      {children}
    </div>
  )
}

interface SortableIssueCardProps {
  issue: IssueVMType
  disabled?: boolean
}

function SortableIssueCard({ issue, disabled }: SortableIssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: issue.id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <IssueCard issue={issue} />
    </div>
  )
}

interface IssueCardProps {
  issue: IssueVMType
  isDragging?: boolean
}

function IssueCard({ issue, isDragging }: IssueCardProps) {
  return (
    <Link href={`/issues/${issue.id}`}>
      <Card className={cn("cursor-pointer hover:shadow-md transition-shadow", isDragging && "shadow-lg rotate-3")}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium line-clamp-2">{issue.title}</p>
            <PriorityBadge priority={issue.priority} size="sm" />
          </div>

          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {issue.labels.slice(0, 3).map((label) => (
                <Badge
                  key={label.id}
                  variant="secondary"
                  className="text-xs px-1.5 py-0"
                  style={{ backgroundColor: `${label.color}20`, color: label.color }}
                >
                  {label.name}
                </Badge>
              ))}
              {issue.labels.length > 3 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  +{issue.labels.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {issue.dueDate && (
                <span className={cn(new Date(issue.dueDate) < new Date() && issue.status !== "Done" && "text-red-500")}>
                  {format(new Date(issue.dueDate), "MM/dd")}
                </span>
              )}
              {issue.subtaskCount > 0 && (
                <span>
                  {issue.completedSubtaskCount}/{issue.subtaskCount}
                </span>
              )}
              {issue.commentCount > 0 && <span>{issue.commentCount} 댓글</span>}
            </div>
            {issue.assignee && (
              <Avatar className="h-5 w-5">
                <AvatarImage src={issue.assignee.profileImage || undefined} />
                <AvatarFallback className="text-xs">{issue.assignee.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
