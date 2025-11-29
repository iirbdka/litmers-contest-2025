import { z } from "zod"
import { Id, SoftDelete, Priority, BaseStatuses } from "./common"
import { Label } from "./project"

// 서브태스크 (FR-039-2)
export const Subtask = z.object({
  id: Id,
  issueId: Id,
  title: z.string().min(1).max(200),
  done: z.boolean(),
  position: z.number().int(),
})

export type SubtaskType = z.infer<typeof Subtask>

// 서브태스크 생성 폼 (FR-039-2)
export const SubtaskForm = z.object({
  title: z.string().min(1, "서브태스크 제목을 입력하세요").max(200, "서브태스크 제목은 최대 200자입니다"),
})

export type SubtaskFormType = z.infer<typeof SubtaskForm>

// 댓글 (FR-060)
export const Comment = z.object({
  id: Id,
  issueId: Id,
  authorId: Id,
  content: z.string().min(1).max(1000),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }).nullable(),
})

export type CommentType = z.infer<typeof Comment>

// 댓글 ViewModel (사용자 정보 포함)
export const CommentVM = Comment.extend({
  author: z.object({
    id: Id,
    name: z.string(),
    profileImage: z.string().url().nullable(),
  }),
})

export type CommentVMType = z.infer<typeof CommentVM>

// 댓글 생성 폼 (FR-060)
export const CommentForm = z.object({
  content: z.string().min(1, "댓글을 입력하세요").max(1000, "댓글은 최대 1000자입니다"),
})

export type CommentFormType = z.infer<typeof CommentForm>

// 이슈 상태 (기본 + 커스텀)
export const IssueStatus = z.union([BaseStatuses, z.string()])
export type IssueStatusType = z.infer<typeof IssueStatus>

// 변경 히스토리 필드
export const HistoryField = z.enum(["status", "assignee", "priority", "title", "dueDate", "description", "labels"])

// 변경 히스토리 아이템 (FR-039)
export const IssueHistoryItem = z.object({
  id: Id,
  issueId: Id,
  field: HistoryField,
  oldValue: z.any().nullable(),
  newValue: z.any().nullable(),
  changedBy: Id,
  changedAt: z.string().datetime({ offset: true }),
})

export type IssueHistoryItemType = z.infer<typeof IssueHistoryItem>

// 변경 히스토리 ViewModel
export const IssueHistoryItemVM = IssueHistoryItem.extend({
  changer: z.object({
    id: Id,
    name: z.string(),
    profileImage: z.string().url().nullable(),
  }),
})

export type IssueHistoryItemVMType = z.infer<typeof IssueHistoryItemVM>

// 이슈 (FR-030)
export const Issue = z
  .object({
    id: Id,
    projectId: Id,
    ownerId: Id,
    title: z.string().min(1).max(200),
    description: z.string().max(5000).nullable(),
    status: IssueStatus,
    priority: Priority.default("MEDIUM"),
    assigneeUserId: Id.nullable(),
    dueDate: z.string().datetime({ offset: true }).nullable(),
    labelIds: z.array(Id).max(5),
    position: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }).nullable(),
    ai: z
      .object({
        summary: z.string().nullable(),
        suggestion: z.string().nullable(),
        commentSummary: z.string().nullable(),
      })
      .optional(),
  })
  .merge(SoftDelete)

export type IssueType = z.infer<typeof Issue>

// 이슈 생성 폼 (FR-030)
export const IssueCreateForm = z.object({
  title: z.string().min(1, "이슈 제목을 입력하세요").max(200, "이슈 제목은 최대 200자입니다"),
  description: z.string().max(5000, "설명은 최대 5000자입니다").optional(),
  assigneeUserId: z.string().uuid().nullable().optional(),
  // Accept both YYYY-MM-DD (HTML date input) and ISO datetime strings
  dueDate: z.string().optional().nullable(),
  priority: Priority.optional(),
  labelIds: z.array(z.string().uuid()).max(5, "라벨은 최대 5개까지 선택 가능합니다").optional(),
})

export type IssueCreateFormType = z.infer<typeof IssueCreateForm>

// 이슈 ViewModel (담당자, 라벨 정보 포함)
export const IssueVM = Issue.extend({
  assignee: z
    .object({
      id: Id,
      name: z.string(),
      profileImage: z.string().url().nullable(),
    })
    .nullable(),
  labels: z.array(Label),
  subtaskCount: z.number().int(),
  completedSubtaskCount: z.number().int(),
  commentCount: z.number().int(),
})

export type IssueVMType = z.infer<typeof IssueVM>

// 이슈 상세 ViewModel (FR-031)
export const IssueDetailVM = IssueVM.extend({
  subtasks: z.array(Subtask).max(20),
  comments: z.array(CommentVM),
  history: z.array(IssueHistoryItemVM),
  owner: z.object({
    id: Id,
    name: z.string(),
    profileImage: z.string().url().nullable(),
  }),
})

export type IssueDetailVMType = z.infer<typeof IssueDetailVM>

// 칸반 컬럼 (FR-050)
export const KanbanColumn = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  wipLimit: z.number().int().nullable(),
  issues: z.array(IssueVM),
})

export type KanbanColumnType = z.infer<typeof KanbanColumn>
