import { z } from "zod"
import { Id } from "./common"

// 알림 타입 (FR-090)
export const NotificationType = z.enum([
  "assigned",
  "commented",
  "due_soon",
  "due_today",
  "team_invite",
  "role_changed",
  "mentioned",
])

export type NotificationTypeEnum = z.infer<typeof NotificationType>

// 알림 (FR-090)
export const Notification = z.object({
  id: Id,
  userId: Id,
  type: NotificationType,
  payload: z.record(z.any()),
  read: z.boolean().default(false),
  createdAt: z.string().datetime({ offset: true }),
})

export type NotificationType_ = z.infer<typeof Notification>

// 알림 ViewModel
export const NotificationVM = Notification.extend({
  title: z.string(),
  message: z.string(),
  link: z.string().optional(),
})

export type NotificationVMType = z.infer<typeof NotificationVM>
