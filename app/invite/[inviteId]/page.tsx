import { Suspense } from "react"
import { InviteAcceptContent } from "@/components/teams/invite-accept-content"
import { Skeleton } from "@/components/ui/skeleton"

interface InvitePageProps {
  params: Promise<{ inviteId: string }>
}

export const metadata = {
  title: "팀 초대 - JiraLite",
  description: "팀 초대를 수락하세요",
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteId } = await params

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Suspense fallback={<Skeleton className="h-64 w-full max-w-md" />}>
        <InviteAcceptContent inviteId={inviteId} />
      </Suspense>
    </div>
  )
}

