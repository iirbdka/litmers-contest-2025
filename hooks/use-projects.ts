import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { api, fetcher } from "@/lib/api/client"
import type {
  ProjectVMType,
  ProjectListItemType,
  ProjectCreateFormType,
  LabelType,
  LabelFormType,
  CustomStatusType,
  CustomStatusFormType,
} from "@/src/schemas"

// Projects list by team
export function useProjects(teamId: string | null) {
  return useSWR<ProjectListItemType[]>(
    teamId ? `/projects?teamId=${teamId}` : null,
    fetcher
  )
}

// Single project
export function useProject(projectId: string | null) {
  return useSWR<ProjectVMType>(
    projectId ? `/projects/${projectId}` : null,
    fetcher
  )
}

// Create project
export function useCreateProject() {
  return useSWRMutation(
    "/projects",
    async (url: string, { arg }: { arg: ProjectCreateFormType & { teamId: string } }) => {
      return api.post<ProjectVMType>(url, arg)
    }
  )
}

// Update project
export function useUpdateProject(projectId: string) {
  return useSWRMutation(
    `/projects/${projectId}`,
    async (url: string, { arg }: { arg: Partial<ProjectCreateFormType & { isArchived: boolean }> }) => {
      return api.patch<ProjectVMType>(url, arg)
    }
  )
}

// Delete project
export function useDeleteProject(projectId: string) {
  return useSWRMutation(`/projects/${projectId}`, async (url: string) => {
    return api.delete(url)
  })
}

// Toggle favorite
export function useToggleFavorite(projectId: string) {
  return useSWRMutation(
    `/projects/${projectId}/favorite`,
    async (url: string, { arg }: { arg: { isFavorite: boolean } }) => {
      if (arg.isFavorite) {
        return api.delete(url)
      } else {
        return api.post(url)
      }
    }
  )
}

// Labels
export function useLabels(projectId: string | null) {
  return useSWR<LabelType[]>(
    projectId ? `/projects/${projectId}/labels` : null,
    fetcher
  )
}

// Create label
export function useCreateLabel(projectId: string) {
  return useSWRMutation(
    `/projects/${projectId}/labels`,
    async (url: string, { arg }: { arg: LabelFormType }) => {
      return api.post<LabelType>(url, arg)
    }
  )
}

// Statuses
export function useStatuses(projectId: string | null) {
  return useSWR<CustomStatusType[]>(
    projectId ? `/projects/${projectId}/statuses` : null,
    fetcher
  )
}

// Create status
export function useCreateStatus(projectId: string) {
  return useSWRMutation(
    `/projects/${projectId}/statuses`,
    async (url: string, { arg }: { arg: CustomStatusFormType }) => {
      return api.post<CustomStatusType>(url, arg)
    }
  )
}

