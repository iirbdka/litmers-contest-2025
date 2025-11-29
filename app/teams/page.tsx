import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { TeamsContent } from "@/components/teams/teams-content"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export const metadata = {
  title: "팀 - JiraLite",
  description: "내 팀 목록",
}

export default function TeamsPage() {
  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <Suspense fallback={<TeamsSkeleton />}>
          <TeamsContent />
        </Suspense>
      </div>
    </AppLayout>
  )
}

function TeamsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
