"use client"

import { useState } from "react"
import { Sparkles, Loader2, RefreshCw, Lightbulb, FileText, MessageSquare } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { validateAIDescriptionLength, validateAICommentSummary, LIMITS } from "@/src/schemas/validators"
import { useAISummary, useAISuggestion, useAICommentSummary } from "@/hooks/use-ai"
import type { IssueDetailVMType } from "@/src/schemas/issue"

interface AISectionProps {
  issue: IssueDetailVMType
  onUpdate?: () => void
}

export function AISection({ issue, onUpdate }: AISectionProps) {
  const [summary, setSummary] = useState(issue.ai?.summary || null)
  const [suggestion, setSuggestion] = useState(issue.ai?.suggestion || null)
  const [commentSummary, setCommentSummary] = useState(issue.ai?.commentSummary || null)
  const [error, setError] = useState<string | null>(null)

  const { trigger: triggerSummary, isMutating: loadingSummary } = useAISummary()
  const { trigger: triggerSuggestion, isMutating: loadingSuggestion } = useAISuggestion()
  const { trigger: triggerCommentSummary, isMutating: loadingCommentSummary } = useAICommentSummary()

  const canGenerateAI = validateAIDescriptionLength(issue.description)
  const canGenerateCommentSummary = validateAICommentSummary(issue.commentCount)

  const generateSummary = async () => {
    if (!canGenerateAI || !issue.description) return

    setError(null)

    try {
      const result = await triggerSummary({
        issueId: issue.id,
        description: issue.description,
      })
      if (result) {
        setSummary(result.summary)
        onUpdate?.()
      }
    } catch (err: any) {
      setError(err.message || "AI 요약 생성에 실패했습니다. 다시 시도해주세요.")
    }
  }

  const generateSuggestion = async () => {
    if (!canGenerateAI) return

    setError(null)

    try {
      const result = await triggerSuggestion({
        issueId: issue.id,
        title: issue.title,
        description: issue.description,
      })
      if (result) {
        setSuggestion(result.suggestion)
        onUpdate?.()
      }
    } catch (err: any) {
      setError(err.message || "AI 제안 생성에 실패했습니다. 다시 시도해주세요.")
    }
  }

  const generateCommentSummary = async () => {
    if (!canGenerateCommentSummary) return

    setError(null)

    try {
      const result = await triggerCommentSummary({ issueId: issue.id })
      if (result) {
        setCommentSummary(result.summary)
        onUpdate?.()
      }
    } catch (err: any) {
      setError(err.message || "댓글 요약 생성에 실패했습니다. 다시 시도해주세요.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI 어시스턴트</CardTitle>
        </div>
        <CardDescription>AI가 이슈 분석과 해결 방안을 제안합니다</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!canGenerateAI && (
          <Alert>
            <AlertDescription>
              AI 기능을 사용하려면 설명이 {LIMITS.AI_MIN_DESCRIPTION_LENGTH}자 이상이어야 합니다.
            </AlertDescription>
          </Alert>
        )}

        {/* Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">이슈 요약</span>
            </div>
            <Button variant="outline" size="sm" onClick={generateSummary} disabled={!canGenerateAI || loadingSummary}>
              {loadingSummary ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : summary ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  재생성
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-3 w-3" />
                  생성
                </>
              )}
            </Button>
          </div>
          {loadingSummary ? (
            <Skeleton className="h-20 w-full" />
          ) : summary ? (
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">AI 요약을 생성하려면 버튼을 클릭하세요</p>
          )}
        </div>

        {/* Suggestion */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">해결 전략 제안</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateSuggestion}
              disabled={!canGenerateAI || loadingSuggestion}
            >
              {loadingSuggestion ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : suggestion ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  재생성
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-3 w-3" />
                  생성
                </>
              )}
            </Button>
          </div>
          {loadingSuggestion ? (
            <Skeleton className="h-32 w-full" />
          ) : suggestion ? (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
              {suggestion}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">AI 제안을 생성하려면 버튼을 클릭하세요</p>
          )}
        </div>

        {/* Comment Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">댓글 요약</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateCommentSummary}
              disabled={!canGenerateCommentSummary || loadingCommentSummary}
            >
              {loadingCommentSummary ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : commentSummary ? (
                <>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  재생성
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-3 w-3" />
                  생성
                </>
              )}
            </Button>
          </div>
          {!canGenerateCommentSummary ? (
            <p className="text-sm text-muted-foreground italic">
              댓글이 {LIMITS.AI_MIN_COMMENTS_FOR_SUMMARY}개 이상일 때 사용 가능합니다
            </p>
          ) : loadingCommentSummary ? (
            <Skeleton className="h-24 w-full" />
          ) : commentSummary ? (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg whitespace-pre-wrap">
              {commentSummary}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">댓글 요약을 생성하려면 버튼을 클릭하세요</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
