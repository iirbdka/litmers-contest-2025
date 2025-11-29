import type { PersonalDashboardType, ProjectDashboardType, TeamStatisticsType } from "@/src/schemas/dashboard"
import { getIssuesByAssignee, getIssuesByProjectId, mockComments, mockIssues } from "./issues"
import { getTeamVMs } from "./teams"
import { getProjectsByTeamId } from "./projects"

export const getPersonalDashboard = (userId: string): PersonalDashboardType => {
  const myIssues = getIssuesByAssignee(userId)
  const today = new Date()
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  const issuesByStatus = [
    { status: "Backlog", count: 0, issues: [] as typeof myIssues },
    { status: "In Progress", count: 0, issues: [] as typeof myIssues },
    { status: "Review", count: 0, issues: [] as typeof myIssues },
    { status: "Testing", count: 0, issues: [] as typeof myIssues },
    { status: "Done", count: 0, issues: [] as typeof myIssues },
  ]

  myIssues.forEach((issue) => {
    const statusGroup = issuesByStatus.find((s) => s.status === issue.status)
    if (statusGroup) {
      statusGroup.count++
      statusGroup.issues.push(issue)
    }
  })

  const upcomingIssues = myIssues
    .filter((i) => i.dueDate && new Date(i.dueDate) <= sevenDaysLater && new Date(i.dueDate) >= today)
    .slice(0, 5)

  const todayIssues = myIssues.filter((i) => i.dueDate && new Date(i.dueDate).toDateString() === today.toDateString())

  const recentComments = mockComments
    .filter((c) => c.authorId === userId)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      issueId: c.issueId,
      issueTitle: mockIssues.find((i) => i.id === c.issueId)?.title || "",
      content: c.content,
      createdAt: c.createdAt,
    }))

  const teams = getTeamVMs(userId)
  const projects = teams.flatMap((t) => getProjectsByTeamId(t.id))

  return {
    myIssues: {
      total: myIssues.length,
      byStatus: issuesByStatus,
    },
    upcomingIssues,
    todayIssues,
    recentComments,
    teams,
    projects,
  }
}

export const getProjectDashboard = (projectId: string): ProjectDashboardType => {
  const issues = getIssuesByProjectId(projectId)
  const today = new Date()
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

  const statusCounts = [
    { status: "Backlog", count: 0, color: "#6B7280" },
    { status: "In Progress", count: 0, color: "#3B82F6" },
    { status: "Review", count: 0, color: "#F59E0B" },
    { status: "Testing", count: 0, color: "#8B5CF6" },
    { status: "Done", count: 0, color: "#10B981" },
  ]

  issues.forEach((issue) => {
    const statusGroup = statusCounts.find((s) => s.status === issue.status)
    if (statusGroup) statusGroup.count++
  })

  const priorityCounts = [
    { priority: "HIGH" as const, count: issues.filter((i) => i.priority === "HIGH").length },
    { priority: "MEDIUM" as const, count: issues.filter((i) => i.priority === "MEDIUM").length },
    { priority: "LOW" as const, count: issues.filter((i) => i.priority === "LOW").length },
  ]

  const doneCount = statusCounts.find((s) => s.status === "Done")?.count || 0
  const completionRate = issues.length > 0 ? (doneCount / issues.length) * 100 : 0

  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const upcomingIssues = issues
    .filter((i) => i.dueDate && new Date(i.dueDate) <= sevenDaysLater && new Date(i.dueDate) >= today)
    .slice(0, 5)

  return {
    statusCounts,
    completionRate,
    priorityCounts,
    recentIssues,
    upcomingIssues,
  }
}

export const getTeamStatistics = (teamId: string, days = 30): TeamStatisticsType => {
  // Mock 트렌드 데이터 생성
  const generateTrend = (days: number) => {
    const trend = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      trend.push({
        date: date.toISOString().split("T")[0],
        count: Math.floor(Math.random() * 5) + 1,
      })
    }
    return trend
  }

  return {
    issueCreationTrend: generateTrend(days),
    issueCompletionTrend: generateTrend(days),
    memberIssueCount: [
      { memberId: "user-001-uuid-0000-000000000001", memberName: "John Doe", assignedCount: 12, completedCount: 8 },
      { memberId: "user-002-uuid-0000-000000000002", memberName: "Jane Smith", assignedCount: 15, completedCount: 10 },
      { memberId: "user-003-uuid-0000-000000000003", memberName: "Mike Johnson", assignedCount: 8, completedCount: 5 },
      { memberId: "user-004-uuid-0000-000000000004", memberName: "Sarah Lee", assignedCount: 10, completedCount: 7 },
    ],
    projectIssueStatus: [
      {
        projectId: "proj-001-uuid-0000-000000000001",
        projectName: "JiraLite Frontend",
        statusCounts: [
          { status: "Backlog", count: 15 },
          { status: "In Progress", count: 8 },
          { status: "Done", count: 22 },
        ],
      },
      {
        projectId: "proj-002-uuid-0000-000000000002",
        projectName: "JiraLite Backend",
        statusCounts: [
          { status: "Backlog", count: 10 },
          { status: "In Progress", count: 5 },
          { status: "Done", count: 18 },
        ],
      },
    ],
  }
}
