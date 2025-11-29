"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle, XCircle, Users, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentUser } from "@/hooks/use-auth"
import { api } from "@/lib/api/client"

interface InviteAcceptContentProps {
  inviteId: string
}

interface InviteInfo {
  id: string
  teamId: string
  teamName: string
  email: string
  status: string
  expiresAt: string
}

export function InviteAcceptContent({ inviteId }: InviteAcceptContentProps) {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useCurrentUser()
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchInvite() {
      try {
        const data = await api.get<InviteInfo>(`/invite/${inviteId}`)
        setInvite(data)
      } catch (err: any) {
        setError(err.message || "초대 정보를 불러올 수 없습니다")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvite()
  }, [inviteId])

  const handleAccept = async () => {
    if (!user) {
      router.push(`/sign-in?redirect=/invite/${inviteId}`)
      return
    }

    setIsAccepting(true)
    setError(null)

    try {
      await api.post(`/invite/${inviteId}/accept`, {})
      setSuccess(true)
      setTimeout(() => {
        router.push(`/teams/${invite?.teamId}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || "초대 수락에 실패했습니다")
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading || userLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (error && !invite) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>초대를 찾을 수 없습니다</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/dashboard">
            <Button>대시보드로 이동</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle>초대를 수락했습니다!</CardTitle>
          <CardDescription>
            {invite?.teamName} 팀의 멤버가 되었습니다.<br />
            잠시 후 팀 페이지로 이동합니다...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const isExpired = invite && new Date(invite.expiresAt) < new Date()

  if (isExpired) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <XCircle className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle>초대가 만료되었습니다</CardTitle>
          <CardDescription>
            이 초대 링크는 더 이상 유효하지 않습니다.<br />
            팀 관리자에게 새 초대를 요청하세요.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/dashboard">
            <Button>대시보드로 이동</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>팀 초대</CardTitle>
        <CardDescription>
          <strong className="text-primary">{invite?.teamName}</strong> 팀에 초대되었습니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
            {error}
          </div>
        )}
        {!user ? (
          <div className="text-center text-sm text-muted-foreground">
            초대를 수락하려면 먼저 로그인해야 합니다.
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            <strong>{user.email}</strong>로 로그인되어 있습니다.
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {!user ? (
          <Link href={`/sign-in?redirect=/invite/${inviteId}`} className="w-full">
            <Button className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              로그인하고 초대 수락
            </Button>
          </Link>
        ) : (
          <Button className="w-full" onClick={handleAccept} disabled={isAccepting}>
            {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            초대 수락
          </Button>
        )}
        <Link href="/dashboard" className="w-full">
          <Button variant="ghost" className="w-full">
            나중에
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

