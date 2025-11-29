import type { NotificationVMType } from "@/src/schemas/notification"

export const mockNotifications: NotificationVMType[] = [
  {
    id: "notif-001-uuid-0000-00000001",
    userId: "user-001-uuid-0000-000000000001",
    type: "assigned",
    payload: { issueId: "issue-003-uuid-000000000003", issueTitle: "칸반 보드 드래그 앤 드롭 구현" },
    read: false,
    createdAt: "2024-02-28T09:00:00+09:00",
    title: "새 이슈가 할당되었습니다",
    message: "칸반 보드 드래그 앤 드롭 구현 이슈가 할당되었습니다.",
    link: "/issues/issue-003-uuid-000000000003",
  },
  {
    id: "notif-002-uuid-0000-00000002",
    userId: "user-001-uuid-0000-000000000001",
    type: "commented",
    payload: { issueId: "issue-001-uuid-000000000001", commenterName: "Jane Smith" },
    read: false,
    createdAt: "2024-02-27T15:30:00+09:00",
    title: "새 댓글이 작성되었습니다",
    message: "Jane Smith님이 로그인 페이지 UI 구현 이슈에 댓글을 남겼습니다.",
    link: "/issues/issue-001-uuid-000000000001",
  },
  {
    id: "notif-003-uuid-0000-00000003",
    userId: "user-001-uuid-0000-000000000001",
    type: "due_soon",
    payload: { issueId: "issue-003-uuid-000000000003", dueDate: "2024-12-03" },
    read: true,
    createdAt: "2024-02-26T09:00:00+09:00",
    title: "마감일이 임박했습니다",
    message: "칸반 보드 드래그 앤 드롭 구현 이슈의 마감일이 1일 남았습니다.",
    link: "/issues/issue-003-uuid-000000000003",
  },
  {
    id: "notif-004-uuid-0000-00000004",
    userId: "user-001-uuid-0000-000000000001",
    type: "team_invite",
    payload: { teamId: "team-002-uuid-0000-000000000002", teamName: "디자인팀" },
    read: true,
    createdAt: "2024-02-05T10:00:00+09:00",
    title: "팀 초대",
    message: "디자인팀에 초대되었습니다.",
    link: "/teams/team-002-uuid-0000-000000000002",
  },
  {
    id: "notif-005-uuid-0000-00000005",
    userId: "user-001-uuid-0000-000000000001",
    type: "due_today",
    payload: { issueId: "issue-006-uuid-000000000006" },
    read: false,
    createdAt: "2024-12-01T08:00:00+09:00",
    title: "오늘 마감인 이슈가 있습니다",
    message: "모바일 반응형 레이아웃 버그 수정 이슈가 오늘 마감입니다.",
    link: "/issues/issue-006-uuid-000000000006",
  },
]

export const getNotificationsByUserId = (userId: string) => mockNotifications.filter((n) => n.userId === userId)
export const getUnreadNotificationCount = (userId: string) =>
  mockNotifications.filter((n) => n.userId === userId && !n.read).length
