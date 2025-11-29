import type {
  ProjectType,
  ProjectVMType,
  LabelType,
  CustomStatusType,
  ProjectListItemType,
} from "@/src/schemas/project"

export const mockLabels: LabelType[] = [
  { id: "label-001-uuid-0000-00000001", projectId: "proj-001-uuid-0000-000000000001", name: "버그", color: "#EF4444" },
  { id: "label-002-uuid-0000-00000002", projectId: "proj-001-uuid-0000-000000000001", name: "기능", color: "#3B82F6" },
  { id: "label-003-uuid-0000-00000003", projectId: "proj-001-uuid-0000-000000000001", name: "개선", color: "#10B981" },
  { id: "label-004-uuid-0000-00000004", projectId: "proj-001-uuid-0000-000000000001", name: "문서", color: "#8B5CF6" },
  { id: "label-005-uuid-0000-00000005", projectId: "proj-001-uuid-0000-000000000001", name: "긴급", color: "#F59E0B" },
  {
    id: "label-006-uuid-0000-00000006",
    projectId: "proj-002-uuid-0000-000000000002",
    name: "디자인",
    color: "#EC4899",
  },
  {
    id: "label-007-uuid-0000-00000007",
    projectId: "proj-002-uuid-0000-000000000002",
    name: "리서치",
    color: "#06B6D4",
  },
]

export const mockCustomStatuses: CustomStatusType[] = [
  {
    id: "cs-001-uuid-0000-000000000001",
    projectId: "proj-001-uuid-0000-000000000001",
    name: "Review",
    color: "#F59E0B",
    position: 3,
    wipLimit: 5,
  },
  {
    id: "cs-002-uuid-0000-000000000002",
    projectId: "proj-001-uuid-0000-000000000001",
    name: "Testing",
    color: "#8B5CF6",
    position: 4,
    wipLimit: 3,
  },
]

export const mockProjects: ProjectType[] = [
  {
    id: "proj-001-uuid-0000-000000000001",
    teamId: "team-001-uuid-0000-000000000001",
    ownerId: "user-001-uuid-0000-000000000001",
    name: "JiraLite Frontend",
    description: "JiraLite 프론트엔드 개발 프로젝트입니다. React와 Next.js를 사용하여 개발합니다.",
    isArchived: false,
    isFavorite: true,
    createdAt: "2024-02-08T09:00:00+09:00",
  },
  {
    id: "proj-002-uuid-0000-000000000002",
    teamId: "team-001-uuid-0000-000000000001",
    ownerId: "user-002-uuid-0000-000000000002",
    name: "JiraLite Backend",
    description: "JiraLite 백엔드 API 개발 프로젝트입니다. Node.js와 PostgreSQL을 사용합니다.",
    isArchived: false,
    isFavorite: false,
    createdAt: "2024-02-10T10:00:00+09:00",
  },
  {
    id: "proj-003-uuid-0000-000000000003",
    teamId: "team-001-uuid-0000-000000000001",
    ownerId: "user-001-uuid-0000-000000000001",
    name: "Mobile App",
    description: "JiraLite 모바일 앱 개발 프로젝트입니다.",
    isArchived: true,
    isFavorite: false,
    createdAt: "2024-03-01T11:00:00+09:00",
  },
  {
    id: "proj-004-uuid-0000-000000000004",
    teamId: "team-002-uuid-0000-000000000002",
    ownerId: "user-002-uuid-0000-000000000002",
    name: "디자인 시스템",
    description: "JiraLite 디자인 시스템 구축 프로젝트입니다.",
    isArchived: false,
    isFavorite: true,
    createdAt: "2024-02-15T09:00:00+09:00",
  },
]

export const getProjectsByTeamId = (teamId: string): ProjectListItemType[] => {
  return mockProjects
    .filter((p) => p.teamId === teamId)
    .map((p) => ({
      ...p,
      issueCount: Math.floor(Math.random() * 50) + 10,
    }))
}

export const getProjectById = (id: string): ProjectVMType | undefined => {
  const project = mockProjects.find((p) => p.id === id)
  if (!project) return undefined

  return {
    ...project,
    issueCount: 45,
    completedIssueCount: 18,
    labels: mockLabels.filter((l) => l.projectId === id),
    customStatuses: mockCustomStatuses.filter((cs) => cs.projectId === id),
  }
}

export const getLabelsByProjectId = (projectId: string) => mockLabels.filter((l) => l.projectId === projectId)
export const getCustomStatusesByProjectId = (projectId: string) =>
  mockCustomStatuses.filter((cs) => cs.projectId === projectId)
