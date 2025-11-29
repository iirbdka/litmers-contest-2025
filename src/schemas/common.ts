import { z } from "zod"

// 공통 타입
export const Id = z.string().uuid()
export const Timestamp = z.string().datetime({ offset: true }).nullable()
export const SoftDelete = z.object({ deletedAt: Timestamp }).partial()

// 팀 역할 (FR-017)
export const UserRole = z.enum(["OWNER", "ADMIN", "MEMBER"])
export type UserRoleType = z.infer<typeof UserRole>

// 우선순위 (FR-037)
export const Priority = z.enum(["HIGH", "MEDIUM", "LOW"])
export type PriorityType = z.infer<typeof Priority>

// 기본 상태 (FR-033/050)
export const BaseStatuses = z.enum(["Backlog", "In Progress", "Done"])
export type BaseStatusType = z.infer<typeof BaseStatuses>

// 초대 상태
export const InviteStatus = z.enum(["pending", "accepted", "expired"])
export type InviteStatusType = z.infer<typeof InviteStatus>

// 페이지네이션 응답
export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
    hasMore: z.boolean(),
  })

// API 응답 래퍼
export const ApiResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  })
