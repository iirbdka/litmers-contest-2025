import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export const metadata = {
  title: "대시보드 - JiraLite",
  description: "개인 대시보드",
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-muted-foreground">내 작업 현황을 한눈에 확인하세요</p>
        </div>
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </AppLayout>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
