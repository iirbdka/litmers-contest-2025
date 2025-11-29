import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { api, fetcher } from "@/lib/api/client"
import type {
  IssueVMType,
  IssueDetailVMType,
  IssueCreateFormType,
  SubtaskType,
  SubtaskFormType,
  CommentVMType,
  CommentFormType,
  KanbanColumnType,
} from "@/src/schemas"

interface IssueFilters {
  status?: string
  assigneeId?: string
  priority?: string
  search?: string
}

// Issues list
export function useIssues(projectId: string | null, filters?: IssueFilters) {
  const params = new URLSearchParams()
  if (projectId) params.set("projectId", projectId)
  if (filters?.status) params.set("status", filters.status)
  if (filters?.assigneeId) params.set("assigneeId", filters.assigneeId)
  if (filters?.priority) params.set("priority", filters.priority)
  if (filters?.search) params.set("search", filters.search)

  return useSWR<IssueVMType[]>(
    projectId ? `/issues?${params.toString()}` : null,
    fetcher
  )
}

// Single issue detail
export function useIssue(issueId: string | null) {
  return useSWR<IssueDetailVMType>(
    issueId ? `/issues/${issueId}` : null,
    fetcher
  )
}

// Create issue
export function useCreateIssue() {
  return useSWRMutation(
    "/issues",
    async (url: string, { arg }: { arg: IssueCreateFormType & { projectId: string } }) => {
      return api.post<IssueVMType>(url, arg)
    }
  )
}

// Update issue
export function useUpdateIssue(issueId: string) {
  return useSWRMutation(
    `/issues/${issueId}`,
    async (
      url: string,
      { arg }: { arg: Partial<IssueCreateFormType> & { status?: string; position?: number } }
    ) => {
      return api.patch(url, arg)
    }
  )
}

// Delete issue
export function useDeleteIssue(issueId: string) {
  return useSWRMutation(`/issues/${issueId}`, async (url: string) => {
    return api.delete(url)
  })
}

// Subtasks
export function useSubtasks(issueId: string | null) {
  return useSWR<SubtaskType[]>(
    issueId ? `/issues/${issueId}/subtasks` : null,
    fetcher
  )
}

// Create subtask
export function useCreateSubtask(issueId: string) {
  return useSWRMutation(
    `/issues/${issueId}/subtasks`,
    async (url: string, { arg }: { arg: SubtaskFormType }) => {
      return api.post<SubtaskType>(url, arg)
    }
  )
}

// Update subtask
export function useUpdateSubtask(issueId: string, subtaskId: string) {
  return useSWRMutation(
    `/issues/${issueId}/subtasks/${subtaskId}`,
    async (url: string, { arg }: { arg: Partial<SubtaskType> }) => {
      return api.patch<SubtaskType>(url, arg)
    }
  )
}

// Delete subtask
export function useDeleteSubtask(issueId: string, subtaskId: string) {
  return useSWRMutation(
    `/issues/${issueId}/subtasks/${subtaskId}`,
    async (url: string) => {
      return api.delete(url)
    }
  )
}

// Comments
export function useComments(issueId: string | null, page = 1, pageSize = 20) {
  return useSWR<{
    items: CommentVMType[]
    total: number
    page: number
    pageSize: number
    hasMore: boolean
  }>(
    issueId ? `/issues/${issueId}/comments?page=${page}&pageSize=${pageSize}` : null,
    fetcher
  )
}

// Create comment
export function useCreateComment(issueId: string) {
  return useSWRMutation(
    `/issues/${issueId}/comments`,
    async (url: string, { arg }: { arg: CommentFormType }) => {
      return api.post<CommentVMType>(url, arg)
    }
  )
}

// Update comment
export function useUpdateComment(issueId: string, commentId: string) {
  return useSWRMutation(
    `/issues/${issueId}/comments/${commentId}`,
    async (url: string, { arg }: { arg: CommentFormType }) => {
      return api.patch<CommentVMType>(url, arg)
    }
  )
}

// Delete comment
export function useDeleteComment(issueId: string, commentId: string) {
  return useSWRMutation(
    `/issues/${issueId}/comments/${commentId}`,
    async (url: string) => {
      return api.delete(url)
    }
  )
}

// Kanban board data (grouped by status)
export function useKanbanBoard(projectId: string | null) {
  const { data: issues, ...rest } = useIssues(projectId)
  const { data: project } = useSWR(
    projectId ? `/projects/${projectId}` : null,
    fetcher
  )

  // Group issues by status into columns
  const columns: KanbanColumnType[] | undefined = project && issues
    ? (project as any).customStatuses.map((status: any) => ({
        id: status.id,
        name: status.name,
        color: status.color,
        wipLimit: status.wipLimit,
        issues: issues.filter((issue) => issue.status === status.name),
      }))
    : undefined

  return { data: columns, ...rest }
}

// Batch update issues (for drag and drop)
export function useBatchUpdateIssues() {
  return useSWRMutation(
    "/issues/batch",
    async (
      _: string,
      { arg }: { arg: Array<{ id: string; status?: string; position: number }> }
    ) => {
      // Update each issue individually (could be optimized with batch endpoint)
      await Promise.all(
        arg.map((update) =>
          api.patch(`/issues/${update.id}`, {
            status: update.status,
            position: update.position,
          })
        )
      )
    }
  )
}

