import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { TeamDetailContent } from "@/components/teams/team-detail-content"
import { SkeletonCard } from "@/components/ui/skeleton-card"

interface TeamDetailPageProps {
  params: Promise<{ teamId: string }>
}

export async function generateMetadata({ params }: TeamDetailPageProps) {
  const { teamId } = await params
  return {
    title: "팀 - JiraLite",
    description: "팀 상세",
  }
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamId } = await params

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <Suspense fallback={<SkeletonCard />}>
          <TeamDetailContent teamId={teamId} />
        </Suspense>
      </div>
    </AppLayout>
  )
}
