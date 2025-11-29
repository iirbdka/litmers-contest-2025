import { z } from "zod"
import { Id, SoftDelete, UserRole, InviteStatus } from "./common"

// 팀 (FR-010)
export const Team = z
  .object({
    id: Id,
    name: z.string().min(1).max(50),
    ownerId: Id,
    createdAt: z.string().datetime({ offset: true }),
  })
  .merge(SoftDelete)

export type TeamType = z.infer<typeof Team>

// 팀 생성 폼 (FR-010)
export const TeamCreateForm = z.object({
  name: z.string().min(1, "팀 이름을 입력하세요").max(50, "팀 이름은 최대 50자입니다"),
})

export type TeamCreateFormType = z.infer<typeof TeamCreateForm>

// 팀 멤버 (FR-014)
export const TeamMember = z
  .object({
    id: Id,
    teamId: Id,
    userId: Id,
    role: UserRole,
    joinedAt: z.string().datetime({ offset: true }),
  })
  .merge(SoftDelete)

export type TeamMemberType = z.infer<typeof TeamMember>

// 팀 멤버 ViewModel (사용자 정보 포함)
export const TeamMemberVM = TeamMember.extend({
  user: z.object({
    id: Id,
    name: z.string(),
    email: z.string().email().nullable().optional(),
    profileImage: z.string().url().nullable(),
  }),
})

export type TeamMemberVMType = z.infer<typeof TeamMemberVM>

// 팀 초대 (FR-013)
export const TeamInvite = z.object({
  id: Id,
  teamId: Id,
  email: z.string().email().max(255),
  status: InviteStatus,
  expiresAt: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
})

export type TeamInviteType = z.infer<typeof TeamInvite>

// 팀 초대 폼 (FR-013)
export const TeamInviteForm = z.object({
  email: z.string().email("유효한 이메일을 입력하세요").max(255),
})

export type TeamInviteFormType = z.infer<typeof TeamInviteForm>

// 활동 로그 (FR-019)
export const ActivityLogItem = z.object({
  id: Id,
  teamId: Id,
  actorId: Id,
  action: z.string(),
  target: z.string(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime({ offset: true }),
})

export type ActivityLogItemType = z.infer<typeof ActivityLogItem>

// 활동 로그 ViewModel (사용자 정보 포함)
export const ActivityLogItemVM = ActivityLogItem.extend({
  actor: z.object({
    id: Id,
    name: z.string(),
    profileImage: z.string().url().nullable(),
  }),
})

export type ActivityLogItemVMType = z.infer<typeof ActivityLogItemVM>

// 팀 ViewModel (프로젝트 수 포함)
export const TeamVM = Team.extend({
  projectCount: z.number().int(),
  memberCount: z.number().int(),
  myRole: UserRole,
})

export type TeamVMType = z.infer<typeof TeamVM>
