"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api/client"
import { useCurrentUser } from "@/hooks/use-auth"

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const inviteId = params.inviteId as string
  const { data: user, isLoading: userLoading } = useCurrentUser()
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "auth_required">("loading")
  const [message, setMessage] = useState("")
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    if (userLoading) return

    if (!user) {
      setStatus("auth_required")
      return
    }

    const acceptInvite = async () => {
      try {
        const result = await api.post<{ success: boolean; teamId: string; message: string }>(
          `/invites/${inviteId}/accept`,
          {}
        )
        setStatus("success")
        setMessage(result.message)
        setTeamId(result.teamId)
      } catch (err: any) {
        setStatus("error")
        setMessage(err.message || "초대 수락에 실패했습니다")
      }
    }

    acceptInvite()
  }, [inviteId, user, userLoading])

  if (userLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">초대를 처리하는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === "auth_required") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              팀 초대를 수락하려면 먼저 로그인하세요.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-2">
            <Link href={`/sign-in?redirect=/invites/${inviteId}/accept`} className="w-full">
              <Button className="w-full">로그인</Button>
            </Link>
            <Link href={`/sign-up?redirect=/invites/${inviteId}/accept`} className="w-full">
              <Button variant="outline" className="w-full">회원가입</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>환영합니다!</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Link href={teamId ? `/teams/${teamId}` : "/dashboard"}>
              <Button>팀으로 이동</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle>초대 수락 실패</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/dashboard">
            <Button>대시보드로 이동</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

