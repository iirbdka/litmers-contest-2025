import { z } from "zod"
import { Id, SoftDelete } from "./common"

// 라벨 (FR-038)
export const Label = z.object({
  id: Id,
  projectId: Id,
  name: z.string().min(1).max(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "유효한 HEX 색상 코드를 입력하세요"),
})

export type LabelType = z.infer<typeof Label>

// 라벨 생성/수정 폼 (FR-038)
export const LabelForm = z.object({
  name: z.string().min(1, "라벨 이름을 입력하세요").max(30, "라벨 이름은 최대 30자입니다"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "유효한 HEX 색상 코드를 입력하세요"),
})

export type LabelFormType = z.infer<typeof LabelForm>

// 커스텀 상태 (FR-053)
export const CustomStatus = z.object({
  id: Id,
  projectId: Id,
  name: z.string().min(1).max(30),
  color: z.string().optional(),
  position: z.number().int(),
  wipLimit: z.number().int().min(1).max(50).nullable(),
})

export type CustomStatusType = z.infer<typeof CustomStatus>

// 커스텀 상태 생성/수정 폼 (FR-053)
export const CustomStatusForm = z.object({
  name: z.string().min(1, "상태 이름을 입력하세요").max(30, "상태 이름은 최대 30자입니다"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  wipLimit: z.number().int().min(1).max(50).nullable().optional(),
})

export type CustomStatusFormType = z.infer<typeof CustomStatusForm>

// 프로젝트 (FR-020)
export const Project = z
  .object({
    id: Id,
    teamId: Id,
    ownerId: Id,
    name: z.string().min(1).max(100),
    description: z.string().max(2000).nullable(),
    isArchived: z.boolean().default(false),
    isFavorite: z.boolean().optional(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .merge(SoftDelete)

export type ProjectType = z.infer<typeof Project>

// 프로젝트 생성 폼 (FR-020)
export const ProjectCreateForm = z.object({
  name: z.string().min(1, "프로젝트 이름을 입력하세요").max(100, "프로젝트 이름은 최대 100자입니다"),
  description: z.string().max(2000, "설명은 최대 2000자입니다").optional(),
})

export type ProjectCreateFormType = z.infer<typeof ProjectCreateForm>

// 프로젝트 ViewModel (이슈 수 등 포함)
export const ProjectVM = Project.extend({
  issueCount: z.number().int(),
  completedIssueCount: z.number().int(),
  labels: z.array(Label),
  customStatuses: z.array(CustomStatus),
})

export type ProjectVMType = z.infer<typeof ProjectVM>

// 프로젝트 목록 아이템 (FR-021)
export const ProjectListItem = Project.extend({
  issueCount: z.number().int(),
})

export type ProjectListItemType = z.infer<typeof ProjectListItem>
