import useSWRMutation from "swr/mutation"
import { api } from "@/lib/api/client"
import type { LabelType, IssueVMType } from "@/src/schemas"

// AI Summary (FR-040)
export function useAISummary() {
  return useSWRMutation(
    "/ai/summary",
    async (
      url: string,
      { arg }: { arg: { issueId: string; description: string } }
    ) => {
      return api.post<{ summary: string; cached: boolean }>(url, arg)
    }
  )
}

// AI Suggestion (FR-041)
export function useAISuggestion() {
  return useSWRMutation(
    "/ai/suggestion",
    async (
      url: string,
      { arg }: { arg: { issueId: string; title: string; description: string | null } }
    ) => {
      return api.post<{ suggestion: string; cached: boolean }>(url, arg)
    }
  )
}

// AI Auto Label (FR-043)
export function useAIAutoLabel() {
  return useSWRMutation(
    "/ai/auto-label",
    async (
      url: string,
      { arg }: { arg: { projectId: string; title: string; description: string | null } }
    ) => {
      return api.post<{ labels: LabelType[] }>(url, arg)
    }
  )
}

// AI Duplicate Detection (FR-044)
export function useAIDuplicateDetection() {
  return useSWRMutation(
    "/ai/duplicate",
    async (
      url: string,
      {
        arg,
      }: {
        arg: {
          projectId: string
          title: string
          description: string | null
          excludeIssueId?: string
        }
      }
    ) => {
      return api.post<{ similarIssues: IssueVMType[] }>(url, arg)
    }
  )
}

// AI Comment Summary (FR-045)
export function useAICommentSummary() {
  return useSWRMutation(
    "/ai/comment-summary",
    async (url: string, { arg }: { arg: { issueId: string } }) => {
      return api.post<{ summary: string; cached: boolean }>(url, arg)
    }
  )
}

