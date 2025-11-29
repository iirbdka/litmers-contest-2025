import { z } from "zod"
import { Id, Priority } from "./common"
import { IssueVM } from "./issue"
import { TeamVM } from "./team"
import { ProjectListItem } from "./project"

// 프로젝트 대시보드 (FR-080)
export const ProjectDashboard = z.object({
  statusCounts: z.array(
    z.object({
      status: z.string(),
      count: z.number().int(),
      color: z.string().optional(),
    }),
  ),
  completionRate: z.number(),
  priorityCounts: z.array(
    z.object({
      priority: Priority,
      count: z.number().int(),
    }),
  ),
  recentIssues: z.array(IssueVM).max(5),
  upcomingIssues: z.array(IssueVM).max(5),
})

export type ProjectDashboardType = z.infer<typeof ProjectDashboard>

// 개인 대시보드 (FR-081)
export const PersonalDashboard = z.object({
  myIssues: z.object({
    total: z.number().int(),
    byStatus: z.array(
      z.object({
        status: z.string(),
        count: z.number().int(),
        issues: z.array(IssueVM),
      }),
    ),
  }),
  upcomingIssues: z.array(IssueVM).max(5),
  todayIssues: z.array(IssueVM),
  recentComments: z
    .array(
      z.object({
        id: Id,
        issueId: Id,
        issueTitle: z.string(),
        content: z.string(),
        createdAt: z.string().datetime({ offset: true }),
      }),
    )
    .max(5),
  teams: z.array(TeamVM),
  projects: z.array(ProjectListItem),
})

export type PersonalDashboardType = z.infer<typeof PersonalDashboard>

// 팀 통계 (FR-082)
export const TeamStatistics = z.object({
  issueCreationTrend: z.array(
    z.object({
      date: z.string(),
      count: z.number().int(),
    }),
  ),
  issueCompletionTrend: z.array(
    z.object({
      date: z.string(),
      count: z.number().int(),
    }),
  ),
  memberIssueCount: z.array(
    z.object({
      memberId: Id,
      memberName: z.string(),
      assignedCount: z.number().int(),
      completedCount: z.number().int(),
    }),
  ),
  projectIssueStatus: z.array(
    z.object({
      projectId: Id,
      projectName: z.string(),
      statusCounts: z.array(
        z.object({
          status: z.string(),
          count: z.number().int(),
        }),
      ),
    }),
  ),
})

export type TeamStatisticsType = z.infer<typeof TeamStatistics>
