import type { TeamType, TeamMemberVMType, TeamInviteType, ActivityLogItemVMType, TeamVMType } from "@/src/schemas/team"
import { mockUsers } from "./users"

export const mockTeams: TeamType[] = [
  {
    id: "team-001-uuid-0000-000000000001",
    name: "개발팀",
    ownerId: "user-001-uuid-0000-000000000001",
    createdAt: "2024-01-15T09:00:00+09:00",
  },
  {
    id: "team-002-uuid-0000-000000000002",
    name: "디자인팀",
    ownerId: "user-002-uuid-0000-000000000002",
    createdAt: "2024-02-01T10:00:00+09:00",
  },
  {
    id: "team-003-uuid-0000-000000000003",
    name: "마케팅팀",
    ownerId: "user-001-uuid-0000-000000000001",
    createdAt: "2024-03-01T11:00:00+09:00",
  },
]

export const mockTeamMembers: TeamMemberVMType[] = [
  // 개발팀 멤버
  {
    id: "tm-001-uuid-0000-000000000001",
    teamId: "team-001-uuid-0000-000000000001",
    userId: "user-001-uuid-0000-000000000001",
    role: "OWNER",
    joinedAt: "2024-01-15T09:00:00+09:00",
    user: mockUsers[0],
  },
  {
    id: "tm-002-uuid-0000-000000000002",
    teamId: "team-001-uuid-0000-000000000001",
    userId: "user-002-uuid-0000-000000000002",
    role: "ADMIN",
    joinedAt: "2024-01-20T10:30:00+09:00",
    user: mockUsers[1],
  },
  {
    id: "tm-003-uuid-0000-000000000003",
    teamId: "team-001-uuid-0000-000000000001",
    userId: "user-003-uuid-0000-000000000003",
    role: "MEMBER",
    joinedAt: "2024-02-01T14:00:00+09:00",
    user: mockUsers[2],
  },
  {
    id: "tm-004-uuid-0000-000000000004",
    teamId: "team-001-uuid-0000-000000000001",
    userId: "user-004-uuid-0000-000000000004",
    role: "MEMBER",
    joinedAt: "2024-02-10T11:00:00+09:00",
    user: mockUsers[3],
  },
  // 디자인팀 멤버
  {
    id: "tm-005-uuid-0000-000000000005",
    teamId: "team-002-uuid-0000-000000000002",
    userId: "user-002-uuid-0000-000000000002",
    role: "OWNER",
    joinedAt: "2024-02-01T10:00:00+09:00",
    user: mockUsers[1],
  },
  {
    id: "tm-006-uuid-0000-000000000006",
    teamId: "team-002-uuid-0000-000000000002",
    userId: "user-001-uuid-0000-000000000001",
    role: "MEMBER",
    joinedAt: "2024-02-05T10:00:00+09:00",
    user: mockUsers[0],
  },
]

export const mockTeamInvites: TeamInviteType[] = [
  {
    id: "inv-001-uuid-0000-000000000001",
    teamId: "team-001-uuid-0000-000000000001",
    email: "newuser@example.com",
    status: "pending",
    expiresAt: "2025-06-10T09:00:00+09:00",
    createdAt: "2025-06-03T09:00:00+09:00",
  },
]

export const mockActivityLogs: ActivityLogItemVMType[] = [
  {
    id: "log-001-uuid-0000-000000000001",
    teamId: "team-001-uuid-0000-000000000001",
    actorId: "user-001-uuid-0000-000000000001",
    action: "member_added",
    target: "Sarah Lee",
    createdAt: "2024-02-10T11:00:00+09:00",
    actor: mockUsers[0],
  },
  {
    id: "log-002-uuid-0000-000000000002",
    teamId: "team-001-uuid-0000-000000000001",
    actorId: "user-001-uuid-0000-000000000001",
    action: "project_created",
    target: "JiraLite Frontend",
    createdAt: "2024-02-08T09:00:00+09:00",
    actor: mockUsers[0],
  },
  {
    id: "log-003-uuid-0000-000000000003",
    teamId: "team-001-uuid-0000-000000000001",
    actorId: "user-001-uuid-0000-000000000001",
    action: "role_changed",
    target: "Jane Smith → ADMIN",
    createdAt: "2024-01-25T14:00:00+09:00",
    actor: mockUsers[0],
  },
  {
    id: "log-004-uuid-0000-000000000004",
    teamId: "team-001-uuid-0000-000000000001",
    actorId: "user-002-uuid-0000-000000000002",
    action: "member_added",
    target: "Mike Johnson",
    createdAt: "2024-02-01T14:00:00+09:00",
    actor: mockUsers[1],
  },
  {
    id: "log-005-uuid-0000-000000000005",
    teamId: "team-001-uuid-0000-000000000001",
    actorId: "user-001-uuid-0000-000000000001",
    action: "project_archived",
    target: "Legacy Backend",
    createdAt: "2024-03-15T10:00:00+09:00",
    actor: mockUsers[0],
  },
]

// 팀 ViewModel 생성 함수
export const getTeamVMs = (userId: string): TeamVMType[] => {
  const userTeamIds = mockTeamMembers
    .filter((m) => m.userId === userId)
    .map((m) => ({ teamId: m.teamId, role: m.role }))

  return mockTeams
    .filter((t) => userTeamIds.some((ut) => ut.teamId === t.id))
    .map((t) => {
      const userRole = userTeamIds.find((ut) => ut.teamId === t.id)!.role
      return {
        ...t,
        projectCount: 3, // Mock count
        memberCount: mockTeamMembers.filter((m) => m.teamId === t.id).length,
        myRole: userRole,
      }
    })
}

export const getTeamById = (id: string) => mockTeams.find((t) => t.id === id)
export const getTeamMembersByTeamId = (teamId: string) => mockTeamMembers.filter((m) => m.teamId === teamId)
export const getActivityLogsByTeamId = (teamId: string) => mockActivityLogs.filter((l) => l.teamId === teamId)
export const getTeamInvitesByTeamId = (teamId: string) => mockTeamInvites.filter((i) => i.teamId === teamId)
