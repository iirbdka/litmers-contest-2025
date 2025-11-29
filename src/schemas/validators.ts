import { z } from "zod"

// 데이터 제한 상수 (PRD 섹션 4)
export const LIMITS = {
  TEAM_MAX_PROJECTS: 15,
  PROJECT_MAX_ISSUES: 200,
  ISSUE_MAX_SUBTASKS: 20,
  PROJECT_MAX_LABELS: 20,
  ISSUE_MAX_LABELS: 5,
  PROJECT_MAX_CUSTOM_STATUSES: 5,
  WIP_LIMIT_MIN: 1,
  WIP_LIMIT_MAX: 50,
  TEAM_NAME_MAX: 50,
  PROJECT_NAME_MAX: 100,
  PROJECT_DESCRIPTION_MAX: 2000,
  ISSUE_TITLE_MAX: 200,
  ISSUE_DESCRIPTION_MAX: 5000,
  SUBTASK_TITLE_MAX: 200,
  LABEL_NAME_MAX: 30,
  CUSTOM_STATUS_NAME_MAX: 30,
  COMMENT_CONTENT_MAX: 1000,
  USER_NAME_MAX: 50,
  EMAIL_MAX: 255,
  PASSWORD_MIN: 6,
  PASSWORD_MAX: 100,
  TOKEN_EXPIRY_HOURS: 24,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  INVITE_EXPIRY_DAYS: 7,
  AI_MIN_DESCRIPTION_LENGTH: 10,
  AI_MIN_COMMENTS_FOR_SUMMARY: 5,
  AI_RATE_LIMIT_PER_MINUTE: 10,
  AI_RATE_LIMIT_PER_DAY: 100,
} as const

// 제한 체크 함수들
export const validateTeamProjectLimit = (currentCount: number) => {
  return currentCount < LIMITS.TEAM_MAX_PROJECTS
}

export const validateProjectIssueLimit = (currentCount: number) => {
  return currentCount < LIMITS.PROJECT_MAX_ISSUES
}

export const validateIssueSubtaskLimit = (currentCount: number) => {
  return currentCount < LIMITS.ISSUE_MAX_SUBTASKS
}

export const validateProjectLabelLimit = (currentCount: number) => {
  return currentCount < LIMITS.PROJECT_MAX_LABELS
}

export const validateIssueLabelLimit = (labelIds: string[]) => {
  return labelIds.length <= LIMITS.ISSUE_MAX_LABELS
}

export const validateProjectCustomStatusLimit = (currentCount: number) => {
  return currentCount < LIMITS.PROJECT_MAX_CUSTOM_STATUSES
}

export const validateAIDescriptionLength = (description: string | null) => {
  return description !== null && description.length > LIMITS.AI_MIN_DESCRIPTION_LENGTH
}

export const validateAICommentSummary = (commentCount: number) => {
  return commentCount >= LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY
}

// WIP Limit 검증 스키마
export const WipLimitSchema = z.number().int().min(LIMITS.WIP_LIMIT_MIN).max(LIMITS.WIP_LIMIT_MAX).nullable()
