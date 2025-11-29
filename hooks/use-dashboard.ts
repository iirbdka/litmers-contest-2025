import useSWR from "swr"
import { fetcher } from "@/lib/api/client"
import type { PersonalDashboardType, ProjectDashboardType, TeamStatisticsType } from "@/src/schemas"

// Personal dashboard (FR-081)
export function usePersonalDashboard() {
  return useSWR<PersonalDashboardType>("/dashboard", fetcher)
}

// Project dashboard (FR-080)
export function useProjectDashboard(projectId: string | null) {
  return useSWR<ProjectDashboardType>(
    projectId ? `/projects/${projectId}/dashboard` : null,
    fetcher
  )
}

// Team statistics (FR-082)
export function useTeamStatistics(teamId: string | null) {
  return useSWR<TeamStatisticsType>(
    teamId ? `/teams/${teamId}/statistics` : null,
    fetcher
  )
}

