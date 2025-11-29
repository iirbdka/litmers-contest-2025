import type { UserType } from "@/src/schemas/user"

export const mockUsers: UserType[] = [
  {
    id: "user-001-uuid-0000-000000000001",
    email: "john@example.com",
    name: "John Doe",
    profileImage: "/man-profile.png",
    provider: "email",
    createdAt: "2024-01-15T09:00:00+09:00",
  },
  {
    id: "user-002-uuid-0000-000000000002",
    email: "jane@example.com",
    name: "Jane Smith",
    profileImage: "/woman-profile.png",
    provider: "google",
    createdAt: "2024-01-20T10:30:00+09:00",
  },
  {
    id: "user-003-uuid-0000-000000000003",
    email: "mike@example.com",
    name: "Mike Johnson",
    profileImage: "/thoughtful-man-profile.png",
    provider: "email",
    createdAt: "2024-02-01T14:00:00+09:00",
  },
  {
    id: "user-004-uuid-0000-000000000004",
    email: "sarah@example.com",
    name: "Sarah Lee",
    profileImage: "/asian-woman-profile.png",
    provider: "email",
    createdAt: "2024-02-10T11:00:00+09:00",
  },
  {
    id: "user-005-uuid-0000-000000000005",
    email: "alex@example.com",
    name: "Alex Kim",
    profileImage: null,
    provider: "google",
    createdAt: "2024-02-15T16:00:00+09:00",
  },
]

// 현재 로그인한 사용자 (Mock)
export const currentUser = mockUsers[0]

export const getUserById = (id: string) => mockUsers.find((u) => u.id === id)
export const getUserByEmail = (email: string) => mockUsers.find((u) => u.email === email)
