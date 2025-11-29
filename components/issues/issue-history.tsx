"use client"

import { formatDistanceToNow } from "date-fns"
import { ko } from "date-fns/locale"
import { ArrowRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { IssueHistoryItemVMType } from "@/src/schemas/issue"

interface IssueHistoryProps {
  history: IssueHistoryItemVMType[]
}

const fieldLabels: Record<string, string> = {
  status: "상태",
  assignee: "담당자",
  priority: "우선순위",
  title: "제목",
  dueDate: "마감일",
  description: "설명",
  labels: "라벨",
}

export function IssueHistory({ history }: IssueHistoryProps) {
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">변경 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">변경 기록이 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">변경 기록</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={item.changer.profileImage || undefined} />
                <AvatarFallback className="text-xs">{item.changer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{item.changer.name}</span>
                  <span className="text-sm text-muted-foreground">
                    님이{" "}
                    <Badge variant="outline" className="font-normal">
                      {fieldLabels[item.field] || item.field}
                    </Badge>
                    을(를) 변경
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">
                    {item.oldValue === null ? "(없음)" : String(item.oldValue)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{item.newValue === null ? "(없음)" : String(item.newValue)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.changedAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
