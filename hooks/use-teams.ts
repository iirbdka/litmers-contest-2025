import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { api, fetcher } from "@/lib/api/client"
import type {
  TeamVMType,
  TeamCreateFormType,
  TeamMemberVMType,
  TeamInviteType,
  TeamInviteFormType,
  ActivityLogItemVMType,
} from "@/src/schemas"

// Teams list
export function useTeams() {
  return useSWR<TeamVMType[]>("/teams", fetcher)
}

// Single team
export function useTeam(teamId: string | null) {
  return useSWR<TeamVMType>(teamId ? `/teams/${teamId}` : null, fetcher)
}

// Create team
export function useCreateTeam() {
  return useSWRMutation(
    "/teams",
    async (url: string, { arg }: { arg: TeamCreateFormType }) => {
      return api.post<TeamVMType>(url, arg)
    }
  )
}

// Update team
export function useUpdateTeam(teamId: string) {
  return useSWRMutation(
    `/teams/${teamId}`,
    async (url: string, { arg }: { arg: Partial<TeamCreateFormType> }) => {
      return api.patch<TeamVMType>(url, arg)
    }
  )
}

// Delete team
export function useDeleteTeam(teamId: string) {
  return useSWRMutation(`/teams/${teamId}`, async (url: string) => {
    return api.delete(url)
  })
}

// Team members
export function useTeamMembers(teamId: string | null) {
  return useSWR<TeamMemberVMType[]>(
    teamId ? `/teams/${teamId}/members` : null,
    fetcher
  )
}

// Update member role
export function useUpdateMemberRole(teamId: string, memberId: string) {
  return useSWRMutation(
    `/teams/${teamId}/members/${memberId}`,
    async (url: string, { arg }: { arg: { role: string } }) => {
      return api.patch(url, arg)
    }
  )
}

// Remove member
export function useRemoveMember(teamId: string, memberId: string) {
  return useSWRMutation(
    `/teams/${teamId}/members/${memberId}`,
    async (url: string) => {
      return api.delete(url)
    }
  )
}

// Team invites
export function useTeamInvites(teamId: string | null) {
  return useSWR<TeamInviteType[]>(
    teamId ? `/teams/${teamId}/invites` : null,
    fetcher
  )
}

// Send invite
export function useSendInvite(teamId: string) {
  return useSWRMutation(
    `/teams/${teamId}/invites`,
    async (url: string, { arg }: { arg: TeamInviteFormType }) => {
      return api.post<TeamInviteType>(url, arg)
    }
  )
}

// Team activities
export function useTeamActivities(
  teamId: string | null,
  page = 1,
  pageSize = 20
) {
  return useSWR<{
    items: ActivityLogItemVMType[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }>(
    teamId ? `/teams/${teamId}/activities?page=${page}&pageSize=${pageSize}` : null,
    fetcher
  )
}

