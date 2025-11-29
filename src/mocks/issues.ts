import type {
  IssueType,
  IssueVMType,
  IssueDetailVMType,
  SubtaskType,
  CommentVMType,
  IssueHistoryItemVMType,
  KanbanColumnType,
} from "@/src/schemas/issue"
import { mockUsers } from "./users"
import { mockLabels, mockCustomStatuses } from "./projects"

export const mockSubtasks: SubtaskType[] = [
  {
    id: "st-001-uuid-0000-000000000001",
    issueId: "issue-001-uuid-000000000001",
    title: "UI 컴포넌트 설계",
    done: true,
    position: 0,
  },
  {
    id: "st-002-uuid-0000-000000000002",
    issueId: "issue-001-uuid-000000000001",
    title: "API 연동 로직 구현",
    done: true,
    position: 1,
  },
  {
    id: "st-003-uuid-0000-000000000003",
    issueId: "issue-001-uuid-000000000001",
    title: "테스트 코드 작성",
    done: false,
    position: 2,
  },
  {
    id: "st-004-uuid-0000-000000000004",
    issueId: "issue-002-uuid-000000000002",
    title: "디자인 검토",
    done: false,
    position: 0,
  },
  {
    id: "st-005-uuid-0000-000000000005",
    issueId: "issue-002-uuid-000000000002",
    title: "반응형 처리",
    done: false,
    position: 1,
  },
]

export const mockComments: CommentVMType[] = [
  {
    id: "cmt-001-uuid-0000-000000000001",
    issueId: "issue-001-uuid-000000000001",
    authorId: "user-002-uuid-0000-000000000002",
    content: "로그인 폼 UI 초안 공유드립니다. 피드백 부탁드려요!",
    createdAt: "2024-02-20T10:00:00+09:00",
    updatedAt: null,
    author: mockUsers[1],
  },
  {
    id: "cmt-002-uuid-0000-000000000002",
    issueId: "issue-001-uuid-000000000001",
    authorId: "user-001-uuid-0000-000000000001",
    content: "좋아 보입니다! 비밀번호 표시/숨김 토글 버튼도 추가해주세요.",
    createdAt: "2024-02-20T11:30:00+09:00",
    updatedAt: null,
    author: mockUsers[0],
  },
  {
    id: "cmt-003-uuid-0000-000000000003",
    issueId: "issue-001-uuid-000000000001",
    authorId: "user-003-uuid-0000-000000000003",
    content: "Google OAuth 버튼 위치는 폼 하단이 좋을 것 같습니다.",
    createdAt: "2024-02-20T14:00:00+09:00",
    updatedAt: null,
    author: mockUsers[2],
  },
  {
    id: "cmt-004-uuid-0000-000000000004",
    issueId: "issue-001-uuid-000000000001",
    authorId: "user-002-uuid-0000-000000000002",
    content: "네, 반영하겠습니다. 내일까지 수정본 공유드릴게요.",
    createdAt: "2024-02-20T15:00:00+09:00",
    updatedAt: null,
    author: mockUsers[1],
  },
  {
    id: "cmt-005-uuid-0000-000000000005",
    issueId: "issue-001-uuid-000000000001",
    authorId: "user-004-uuid-0000-000000000004",
    content: "접근성 측면에서 탭 순서도 확인 부탁드립니다.",
    createdAt: "2024-02-21T09:00:00+09:00",
    updatedAt: null,
    author: mockUsers[3],
  },
  {
    id: "cmt-006-uuid-0000-000000000006",
    issueId: "issue-001-uuid-000000000001",
    authorId: "user-001-uuid-0000-000000000001",
    content: "수정본 확인했습니다. LGTM! 머지 진행해주세요.",
    createdAt: "2024-02-22T10:00:00+09:00",
    updatedAt: null,
    author: mockUsers[0],
  },
]

export const mockHistory: IssueHistoryItemVMType[] = [
  {
    id: "hist-001-uuid-0000-00000001",
    issueId: "issue-001-uuid-000000000001",
    field: "status",
    oldValue: "Backlog",
    newValue: "In Progress",
    changedBy: "user-001-uuid-0000-000000000001",
    changedAt: "2024-02-18T09:00:00+09:00",
    changer: mockUsers[0],
  },
  {
    id: "hist-002-uuid-0000-00000002",
    issueId: "issue-001-uuid-000000000001",
    field: "assignee",
    oldValue: null,
    newValue: "Jane Smith",
    changedBy: "user-001-uuid-0000-000000000001",
    changedAt: "2024-02-18T09:05:00+09:00",
    changer: mockUsers[0],
  },
  {
    id: "hist-003-uuid-0000-00000003",
    issueId: "issue-001-uuid-000000000001",
    field: "priority",
    oldValue: "MEDIUM",
    newValue: "HIGH",
    changedBy: "user-002-uuid-0000-000000000002",
    changedAt: "2024-02-19T14:00:00+09:00",
    changer: mockUsers[1],
  },
]

export const mockIssues: IssueType[] = [
  {
    id: "issue-001-uuid-000000000001",
    projectId: "proj-001-uuid-0000-000000000001",
    ownerId: "user-001-uuid-0000-000000000001",
    title: "로그인 페이지 UI 구현",
    description:
      "사용자 로그인을 위한 UI 페이지를 구현합니다.\n\n## 요구사항\n- 이메일/비밀번호 입력 폼\n- 유효성 검증\n- Google OAuth 로그인 버튼\n- 비밀번호 찾기 링크\n\n## 참고자료\n피그마 디자인 링크 참조",
    status: "In Progress",
    priority: "HIGH",
    assigneeUserId: "user-002-uuid-0000-000000000002",
    dueDate: "2024-12-05T23:59:59+09:00",
    labelIds: ["label-002-uuid-0000-00000002", "label-005-uuid-0000-00000005"],
    position: 0,
    createdAt: "2024-02-15T09:00:00+09:00",
    updatedAt: "2024-02-22T10:00:00+09:00",
    ai: {
      summary: "로그인 페이지 UI 구현 이슈입니다. 이메일/비밀번호 폼, Google OAuth, 비밀번호 찾기 기능이 포함됩니다.",
      suggestion:
        "1. shadcn/ui의 Form 컴포넌트를 활용하여 유효성 검증을 구현하세요.\n2. next-auth를 사용하여 Google OAuth를 쉽게 통합할 수 있습니다.\n3. 모바일 반응형을 먼저 고려하여 개발하세요.",
      commentSummary:
        "UI 초안에 대한 긍정적 피드백이 있었고, 비밀번호 토글, OAuth 버튼 위치, 접근성(탭 순서) 관련 개선 요청이 있었습니다. 최종 승인되어 머지 예정입니다.",
    },
  },
  {
    id: "issue-002-uuid-000000000002",
    projectId: "proj-001-uuid-0000-000000000001",
    ownerId: "user-001-uuid-0000-000000000001",
    title: "대시보드 차트 컴포넌트 개발",
    description: "프로젝트 대시보드에 표시될 차트 컴포넌트들을 개발합니다.",
    status: "Backlog",
    priority: "MEDIUM",
    assigneeUserId: "user-003-uuid-0000-000000000003",
    dueDate: "2024-12-10T23:59:59+09:00",
    labelIds: ["label-002-uuid-0000-00000002"],
    position: 1,
    createdAt: "2024-02-16T10:00:00+09:00",
    updatedAt: null,
  },
  {
    id: "issue-003-uuid-000000000003",
    projectId: "proj-001-uuid-0000-000000000001",
    ownerId: "user-002-uuid-0000-000000000002",
    title: "칸반 보드 드래그 앤 드롭 구현",
    description: "칸반 보드에서 이슈 카드를 드래그 앤 드롭으로 이동할 수 있도록 구현합니다.",
    status: "In Progress",
    priority: "HIGH",
    assigneeUserId: "user-001-uuid-0000-000000000001",
    dueDate: "2024-12-03T23:59:59+09:00",
    labelIds: ["label-002-uuid-0000-00000002", "label-003-uuid-0000-00000003"],
    position: 1,
    createdAt: "2024-02-17T11:00:00+09:00",
    updatedAt: "2024-02-20T15:00:00+09:00",
  },
  {
    id: "issue-004-uuid-000000000004",
    projectId: "proj-001-uuid-0000-000000000001",
    ownerId: "user-001-uuid-0000-000000000001",
    title: "알림 시스템 구현",
    description: "인앱 알림 기능을 구현합니다. 이슈 할당, 댓글, 마감일 알림 등을 포함합니다.",
    status: "Review",
    priority: "MEDIUM",
    assigneeUserId: "user-004-uuid-0000-000000000004",
    dueDate: "2024-12-08T23:59:59+09:00",
    labelIds: ["label-002-uuid-0000-00000002"],
    position: 0,
    createdAt: "2024-02-18T09:00:00+09:00",
    updatedAt: "2024-02-25T10:00:00+09:00",
  },
  {
    id: "issue-005-uuid-000000000005",
    projectId: "proj-001-uuid-0000-000000000001",
    ownerId: "user-003-uuid-0000-000000000003",
    title: "API 문서화",
    description: "백엔드 API 문서를 Swagger/OpenAPI로 작성합니다.",
    status: "Done",
    priority: "LOW",
    assigneeUserId: "user-003-uuid-0000-000000000003",
    dueDate: null,
    labelIds: ["label-004-uuid-0000-00000004"],
    position: 0,
    createdAt: "2024-02-10T14:00:00+09:00",
    updatedAt: "2024-02-28T16:00:00+09:00",
  },
  {
    id: "issue-006-uuid-000000000006",
    projectId: "proj-001-uuid-0000-000000000001",
    ownerId: "user-001-uuid-0000-000000000001",
    title: "모바일 반응형 레이아웃 버그 수정",
    description: "모바일에서 사이드바가 제대로 닫히지 않는 버그를 수정합니다.",
    status: "Backlog",
    priority: "HIGH",
    assigneeUserId: null,
    dueDate: "2024-12-01T23:59:59+09:00",
    labelIds: ["label-001-uuid-0000-00000001", "label-005-uuid-0000-00000005"],
    position: 2,
    createdAt: "2024-02-25T11:00:00+09:00",
    updatedAt: null,
  },
  {
    id: "issue-007-uuid-000000000007",
    projectId: "proj-001-uuid-0000-000000000001",
    ownerId: "user-002-uuid-0000-000000000002",
    title: "팀 설정 페이지 개발",
    description: "팀 정보 수정, 멤버 관리 등을 할 수 있는 설정 페이지를 개발합니다.",
    status: "Testing",
    priority: "MEDIUM",
    assigneeUserId: "user-002-uuid-0000-000000000002",
    dueDate: "2024-12-07T23:59:59+09:00",
    labelIds: ["label-002-uuid-0000-00000002"],
    position: 0,
    createdAt: "2024-02-20T09:00:00+09:00",
    updatedAt: "2024-02-27T14:00:00+09:00",
  },
  {
    id: "issue-008-uuid-000000000008",
    projectId: "proj-001-uuid-0000-000000000001",
    ownerId: "user-001-uuid-0000-000000000001",
    title: "다크 모드 지원",
    description: "전체 애플리케이션에 다크 모드를 지원합니다.",
    status: "Done",
    priority: "LOW",
    assigneeUserId: "user-001-uuid-0000-000000000001",
    dueDate: null,
    labelIds: ["label-003-uuid-0000-00000003"],
    position: 1,
    createdAt: "2024-02-12T10:00:00+09:00",
    updatedAt: "2024-02-22T11:00:00+09:00",
  },
]

// IssueVM 생성 함수
export const getIssueVM = (issue: IssueType): IssueVMType => {
  const assignee = issue.assigneeUserId ? mockUsers.find((u) => u.id === issue.assigneeUserId) : null
  const labels = mockLabels.filter((l) => issue.labelIds.includes(l.id))
  const subtasks = mockSubtasks.filter((st) => st.issueId === issue.id)
  const comments = mockComments.filter((c) => c.issueId === issue.id)

  return {
    ...issue,
    assignee: assignee ? { id: assignee.id, name: assignee.name, profileImage: assignee.profileImage } : null,
    labels,
    subtaskCount: subtasks.length,
    completedSubtaskCount: subtasks.filter((st) => st.done).length,
    commentCount: comments.length,
  }
}

// 프로젝트별 이슈 목록
export const getIssuesByProjectId = (projectId: string): IssueVMType[] => {
  return mockIssues.filter((i) => i.projectId === projectId).map(getIssueVM)
}

// 이슈 상세
export const getIssueDetailById = (issueId: string): IssueDetailVMType | undefined => {
  const issue = mockIssues.find((i) => i.id === issueId)
  if (!issue) return undefined

  const owner = mockUsers.find((u) => u.id === issue.ownerId)!
  const assignee = issue.assigneeUserId ? mockUsers.find((u) => u.id === issue.assigneeUserId) : null
  const labels = mockLabels.filter((l) => issue.labelIds.includes(l.id))
  const subtasks = mockSubtasks.filter((st) => st.issueId === issueId)
  const comments = mockComments.filter((c) => c.issueId === issueId)
  const history = mockHistory.filter((h) => h.issueId === issueId)

  return {
    ...issue,
    owner: { id: owner.id, name: owner.name, profileImage: owner.profileImage },
    assignee: assignee ? { id: assignee.id, name: assignee.name, profileImage: assignee.profileImage } : null,
    labels,
    subtaskCount: subtasks.length,
    completedSubtaskCount: subtasks.filter((st) => st.done).length,
    commentCount: comments.length,
    subtasks,
    comments,
    history,
  }
}

// 칸반 보드 데이터
export const getKanbanData = (projectId: string): KanbanColumnType[] => {
  const issues = mockIssues.filter((i) => i.projectId === projectId)
  const customStatuses = mockCustomStatuses.filter((cs) => cs.projectId === projectId)

  const baseColumns: KanbanColumnType[] = [
    { id: "Backlog", name: "Backlog", color: "#6B7280", wipLimit: null, issues: [] },
    { id: "In Progress", name: "In Progress", color: "#3B82F6", wipLimit: 10, issues: [] },
    { id: "Done", name: "Done", color: "#10B981", wipLimit: null, issues: [] },
  ]

  // 커스텀 상태 컬럼 추가
  const customColumns: KanbanColumnType[] = customStatuses.map((cs) => ({
    id: cs.name,
    name: cs.name,
    color: cs.color,
    wipLimit: cs.wipLimit,
    issues: [],
  }))

  const allColumns = [...baseColumns.slice(0, 2), ...customColumns, baseColumns[2]]

  // 이슈를 컬럼에 배치
  issues.forEach((issue) => {
    const column = allColumns.find((c) => c.id === issue.status)
    if (column) {
      column.issues.push(getIssueVM(issue))
    }
  })

  // position으로 정렬
  allColumns.forEach((col) => {
    col.issues.sort((a, b) => a.position - b.position)
  })

  return allColumns
}

// 담당자별 이슈
export const getIssuesByAssignee = (userId: string): IssueVMType[] => {
  return mockIssues.filter((i) => i.assigneeUserId === userId).map(getIssueVM)
}
